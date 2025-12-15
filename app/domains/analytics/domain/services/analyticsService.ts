import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseDomainService } from '../../../../shared/domain/base_service';
import { DifficultyLevelEnum } from '../../../question-bank/entities/enums/DifficultyLevels';
import {
    AutomaticExamReportOptions,
    AutomaticExamReportRow,
    ExamComparisonReportOptions,
    ExamComparisonRow,
    ExamComparisonTopicDistribution,
    ExamPerformanceReport,
    ExamPerformanceRow,
    PopularQuestionsReportOptions,
    PopularQuestionsReportRow,
    ReviewerActivityReportOptions,
    ReviewerActivityRow,
    SubjectDifficultyCorrelationRow,
    SubjectDifficultyDetail,
    SubjectDifficultyReport,
    SubjectDifficultyReportOptions,
    ValidatedExamsReportOptions,
    ValidatedExamReportRow,
} from '../../schemas/analyticsSchema';
import {
    ExamComparisonFilter,
    ExamDifficultyRecord,
    ExamTopicRecord,
    IAnalyticsRepository,
    ReviewerActivityFilter,
    SubjectDifficultyRecord,
} from '../ports/IAnalyticsRepository';

const difficultyWeight: Record<DifficultyLevelEnum, number> = {
    [DifficultyLevelEnum.EASY]: 1,
    [DifficultyLevelEnum.MEDIUM]: 2,
    [DifficultyLevelEnum.HARD]: 3,
};

type Deps = {
    analyticsRepo: IAnalyticsRepository;
};

export class AnalyticsService extends BaseDomainService {
    constructor(private readonly dependencies: Deps) {
        super();
    }

    async listAutomaticExams(
        input: AutomaticExamReportOptions,
    ): Promise<PaginatedSchema<AutomaticExamReportRow>> {
        const { items, total } = await this.dependencies.analyticsRepo.fetchAutomaticExams(input);
        const enriched = items.map((item) => ({
            ...item,
            parameterSummary: this.summarizeAutomaticParameters(item.parameters),
        }));
        return new PaginatedSchema(enriched, { limit: input.limit, offset: input.offset, total });
    }

    async listPopularQuestions(
        input: PopularQuestionsReportOptions,
    ): Promise<PaginatedSchema<PopularQuestionsReportRow>> {
        const { items, total } = await this.dependencies.analyticsRepo.fetchPopularQuestions(input);
        return new PaginatedSchema(items, { limit: input.limit, offset: input.offset, total });
    }

    async listValidatedExams(
        input: ValidatedExamsReportOptions,
    ): Promise<PaginatedSchema<ValidatedExamReportRow>> {
        const { items, total } = await this.dependencies.analyticsRepo.fetchValidatedExams(input);
        return new PaginatedSchema(items, { limit: input.limit, offset: input.offset, total });
    }

    async getExamPerformance(examId: string): Promise<ExamPerformanceReport> {
        const rows = await this.dependencies.analyticsRepo.fetchExamPerformance(examId);
        const overall = this.calculateOverallSuccess(rows);
        const difficultyGroups = this.buildDifficultyGroups(rows);
        return {
            examId,
            questions: rows,
            overallSuccessRate: overall,
            difficultyGroups,
        };
    }

    async getSubjectDifficultyReport(
        input: SubjectDifficultyReportOptions,
    ): Promise<SubjectDifficultyReport> {
        const records = await this.dependencies.analyticsRepo.fetchSubjectDifficultyRecords(input);
        const grouped = new Map<
            string,
            { subjectName: string | null; details: SubjectDifficultyDetail[] }
        >();
        const order: string[] = [];

        records.forEach((record: SubjectDifficultyRecord) => {
            if (!grouped.has(record.subjectId)) {
                order.push(record.subjectId);
                grouped.set(record.subjectId, { subjectName: record.subjectName, details: [] });
            }
            const bucket = grouped.get(record.subjectId)!;
            bucket.details.push({
                difficulty: record.difficulty,
                averageGrade: record.averageGrade,
                examCount: record.examCount,
            });
        });

        const selectedSubjects = input.exportAll
            ? order
            : order.slice(input.offset, input.offset + input.limit);
        const subjectCorrelations: SubjectDifficultyCorrelationRow[] = selectedSubjects.map(
            (subjectId) => {
                const bucket = grouped.get(subjectId)!;
                return {
                    subjectId,
                    subjectName: bucket.subjectName,
                    difficultyDetails: bucket.details,
                    correlationScore: this.estimateCorrelation(bucket.details),
                };
            },
        );

        const topFailingQuestions =
            await this.dependencies.analyticsRepo.fetchTopFailingQuestions(10);
        const regradeComparison = await this.dependencies.analyticsRepo.fetchRegradeComparison();

        return {
            subjectCorrelations,
            topFailingQuestions,
            regradeComparison,
        };
    }

    async compareExamsAcrossSubjects(
        input: ExamComparisonReportOptions,
    ): Promise<PaginatedSchema<ExamComparisonRow>> {
        const comparisonFilter: ExamComparisonFilter = input;
        const base =
            await this.dependencies.analyticsRepo.fetchExamComparisonBase(comparisonFilter);
        if (!base.exams.length) {
            return new PaginatedSchema([], {
                limit: input.limit,
                offset: input.offset,
                total: base.total,
            });
        }

        const examIds = base.exams.map((exam) => exam.examId);
        const difficultyRecords =
            await this.dependencies.analyticsRepo.fetchExamDifficultyRecords(examIds);
        const topicRecords = await this.dependencies.analyticsRepo.fetchExamTopicRecords(examIds);

        const rows = base.exams.map((exam) =>
            this.buildComparisonRow(exam, difficultyRecords, topicRecords, input.balanceThreshold),
        );

        return new PaginatedSchema(rows, {
            limit: input.limit,
            offset: input.offset,
            total: base.total,
        });
    }

    async listReviewerActivity(
        input: ReviewerActivityReportOptions,
    ): Promise<PaginatedSchema<ReviewerActivityRow>> {
        const filter: ReviewerActivityFilter = input;
        const { items, total } =
            await this.dependencies.analyticsRepo.fetchReviewerActivity(filter);
        return new PaginatedSchema(items, { limit: input.limit, offset: input.offset, total });
    }

    private calculateOverallSuccess(rows: ExamPerformanceRow[]): number {
        const numerator = rows.reduce((sum, row) => sum + row.averageScore * row.attempts, 0);
        const denominator = rows.reduce((sum, row) => sum + row.questionScore * row.attempts, 0);
        return denominator === 0 ? 0 : numerator / denominator;
    }

    private buildDifficultyGroups(
        rows: ExamPerformanceRow[],
    ): ExamPerformanceReport['difficultyGroups'] {
        const accumulator: Record<
            DifficultyLevelEnum,
            { totalScore: number; totalPossible: number; count: number }
        > = {
            [DifficultyLevelEnum.EASY]: { totalScore: 0, totalPossible: 0, count: 0 },
            [DifficultyLevelEnum.MEDIUM]: { totalScore: 0, totalPossible: 0, count: 0 },
            [DifficultyLevelEnum.HARD]: { totalScore: 0, totalPossible: 0, count: 0 },
        };

        rows.forEach((row: ExamPerformanceRow) => {
            const bucket = accumulator[row.difficulty];
            bucket.totalScore += row.averageScore * row.attempts;
            bucket.totalPossible += row.questionScore * row.attempts;
            bucket.count += 1;
        });

        return (Object.keys(accumulator) as DifficultyLevelEnum[]).map((difficulty) => {
            const bucket = accumulator[difficulty];
            const successRate =
                bucket.totalPossible === 0 ? 0 : bucket.totalScore / bucket.totalPossible;
            return {
                difficulty,
                successRate,
                examCount: bucket.count,
            };
        });
    }

    private estimateCorrelation(details: SubjectDifficultyDetail[]): number {
        const valid = details.filter((detail) => detail.averageGrade !== null);
        if (valid.length < 2) return 0;

        const xMean =
            valid.reduce((sum, detail) => sum + difficultyWeight[detail.difficulty], 0) /
            valid.length;
        const yMean =
            valid.reduce((sum, detail) => sum + (detail.averageGrade ?? 0), 0) / valid.length;

        const numerator = valid.reduce((sum, detail) => {
            const x = difficultyWeight[detail.difficulty];
            const y = detail.averageGrade ?? 0;
            return sum + (x - xMean) * (y - yMean);
        }, 0);

        const denominator = valid.reduce((sum, detail) => {
            const x = difficultyWeight[detail.difficulty];
            return sum + (x - xMean) ** 2;
        }, 0);

        return denominator === 0 ? 0 : numerator / denominator;
    }

    private buildComparisonRow(
        exam: { examId: string; title: string; subjectId: string; subjectName: string | null },
        difficultyRecords: ExamDifficultyRecord[],
        topicRecords: ExamTopicRecord[],
        threshold: number,
    ): ExamComparisonRow {
        const difficulties: DifficultyLevelEnum[] = [
            DifficultyLevelEnum.EASY,
            DifficultyLevelEnum.MEDIUM,
            DifficultyLevelEnum.HARD,
        ];
        const counts = difficulties.reduce<Record<DifficultyLevelEnum, number>>(
            (acc, difficulty) => {
                acc[difficulty] = difficultyRecords
                    .filter(
                        (record) =>
                            record.examId === exam.examId && record.difficulty === difficulty,
                    )
                    .reduce((sum, record) => sum + record.count, 0);
                return acc;
            },
            {} as Record<DifficultyLevelEnum, number>,
        );

        const totalQuestions = Object.values(counts).reduce((sum, value) => sum + value, 0);
        const distribution = difficulties.reduce<Record<DifficultyLevelEnum, number>>(
            (acc, difficulty) => {
                acc[difficulty] = totalQuestions === 0 ? 0 : counts[difficulty] / totalQuestions;
                return acc;
            },
            {} as Record<DifficultyLevelEnum, number>,
        );

        const maxRatio = Math.max(...Object.values(distribution));
        const minRatio = Math.min(...Object.values(distribution));
        const balanceGap = totalQuestions === 0 ? 0 : maxRatio - minRatio;
        const balanced = balanceGap <= threshold;

        const topicDistribution = this.buildTopicDistribution(exam.examId, topicRecords);

        return {
            examId: exam.examId,
            title: exam.title,
            subjectId: exam.subjectId,
            subjectName: exam.subjectName,
            difficultyDistribution: distribution,
            totalQuestions,
            topicDistribution,
            balanceGap,
            balanced,
        };
    }

    private buildTopicDistribution(
        examId: string,
        topicRecords: ExamTopicRecord[],
    ): ExamComparisonTopicDistribution[] {
        const target = topicRecords.filter((record) => record.examId === examId);
        return target.map((record) => ({
            topicId: record.topicId,
            topicName: record.topicName,
            questionCount: record.count,
        }));
    }

    private summarizeAutomaticParameters(params: unknown): string {
        const isRecord = (value: unknown): value is Record<string, unknown> =>
            typeof value === 'object' && value !== null && !Array.isArray(value);
        if (!isRecord(params) || Object.keys(params).length === 0) return 'Sin detalles';

        const getNumber = (value: unknown): number | null => {
            const num = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(num) ? num : null;
        };

        const formatDistribution = (record: Record<string, unknown>): string => {
            const entries = Object.entries(record);
            if (!entries.length) return '';
            return entries
                .map(([key, value]) => {
                    const num = typeof value === 'number' ? value : Number(value);
                    const display =
                        Number.isFinite(num) && num >= 0 && num <= 1
                            ? `${(num * 100).toFixed(0)}%`
                            : String(value);
                    return `${key}: ${display}`;
                })
                .join(', ');
        };

        const total =
            getNumber(params.questionCount) ??
            getNumber(params.totalQuestions) ??
            (isRecord(params.topicProportion)
                ? Object.values(params.topicProportion)
                      .map((v) => getNumber(v) ?? 0)
                      .reduce((a, b) => a + b, 0)
                : null);

        const typeDistribution =
            (isRecord(params.topicProportion) && params.topicProportion) ||
            (isRecord(params.questionTypes) && params.questionTypes) ||
            (isRecord(params.typeDistribution) && params.typeDistribution) ||
            (isRecord(params.questionTypeDistribution) && params.questionTypeDistribution) ||
            (isRecord(params.questionTypeProportion) && params.questionTypeProportion) ||
            (isRecord(params.questionTypeCoverage) && params.questionTypeCoverage) ||
            (isRecord(params.questionTypePercentages) && params.questionTypePercentages);

        const typeText = (() => {
            if (!typeDistribution) return 'sin datos';
            const entries = Object.entries(typeDistribution);
            if (!entries.length) return 'sin datos';
            const sum =
                total !== null
                    ? total
                    : entries.reduce((acc, [, val]) => acc + (getNumber(val) ?? 0), 0);
            if (sum === 0) return 'sin datos';

            const parts = entries.map(([label, val]) => {
                const num = getNumber(val);
                if (num === null) return `${label}: -`;
                const ratio = num > 1 ? num / sum : num; // si vienen en 0-1 ya es proporción
                const pct = (ratio * 100).toFixed(0);
                return `${label}: ${pct}%`;
            });
            return parts.join(', ');
        })();

        const topicCoverage =
            (isRecord(params.topicCoverage) && params.topicCoverage) ||
            (isRecord(params.topics) && params.topics) ||
            (Array.isArray(params.topics) && { topics: params.topics });

        const topicText = (() => {
            if (!topicCoverage) return 'sin datos';
            if (Array.isArray((topicCoverage as Record<string, unknown>).topics)) {
                const topics = (topicCoverage as Record<string, unknown>).topics as unknown[];
                const names = topics
                    .map((t: unknown) =>
                        isRecord(t)
                            ? String(t.title ?? t.name ?? t.topicName ?? '')
                            : typeof t === 'string'
                              ? t
                              : '',
                    )
                    .filter(Boolean);
                if (names.length) return names.join(', ');
            }
            const distribution = formatDistribution(topicCoverage as Record<string, unknown>);
            if (distribution) return distribution;
            const keys = Object.keys(topicCoverage as Record<string, unknown>);
            return keys.length ? keys.join(', ') : 'sin datos';
        })();

        const totalText = total !== null ? String(total) : 'sin datos';

        const lines = [
            `- Proporción de preguntas por tipo: ${typeText}`,
            `- Cobertura de temas: ${topicText}`,
            `- Cantidad total de preguntas: ${totalText}`,
        ];
        return lines.join('\n');
    }
}
