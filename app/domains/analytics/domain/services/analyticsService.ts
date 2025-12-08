import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseDomainService } from '../../../../shared/domain/base_service';
import { DifficultyLevelEnum } from '../../../question-bank/entities/enums/DifficultyLevels';
import {
    AutomaticExamReportInput,
    AutomaticExamReportRow,
    ExamComparisonReportInput,
    ExamComparisonRow,
    ExamComparisonTopicDistribution,
    ExamPerformanceReport,
    ExamPerformanceRow,
    PopularQuestionsReportInput,
    PopularQuestionsReportRow,
    ReviewerActivityReportInput,
    ReviewerActivityRow,
    SubjectDifficultyCorrelationRow,
    SubjectDifficultyDetail,
    SubjectDifficultyReport,
    ValidatedExamsReportInput,
    ValidatedExamReportRow,
} from '../../schemas/analyticsSchema';
import {
    ExamComparisonFilter,
    ExamDifficultyRecord,
    ExamTopicRecord,
    IAnalyticsRepository,
    ReviewerActivityFilter,
    SubjectDifficultyFilter,
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
        input: AutomaticExamReportInput,
    ): Promise<PaginatedSchema<AutomaticExamReportRow>> {
        const { items, total } = await this.dependencies.analyticsRepo.fetchAutomaticExams(input);
        return new PaginatedSchema(items, { limit: input.limit, offset: input.offset, total });
    }

    async listPopularQuestions(
        input: PopularQuestionsReportInput,
    ): Promise<PaginatedSchema<PopularQuestionsReportRow>> {
        const { items, total } = await this.dependencies.analyticsRepo.fetchPopularQuestions(input);
        return new PaginatedSchema(items, { limit: input.limit, offset: input.offset, total });
    }

    async listValidatedExams(
        input: ValidatedExamsReportInput,
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
        input: SubjectDifficultyFilter,
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

        const selectedSubjects = order.slice(input.offset, input.offset + input.limit);
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
        input: ExamComparisonReportInput,
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
        input: ReviewerActivityReportInput,
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
                questionCount: bucket.count,
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
}
