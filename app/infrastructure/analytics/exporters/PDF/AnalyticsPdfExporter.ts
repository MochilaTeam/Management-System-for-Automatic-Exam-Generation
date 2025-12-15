import {
    AnalyticsReportExporter,
    AnalyticsReportKey,
} from '../../../../domains/analytics/application/ports/AnalyticsReportExporter';
import {
    AutomaticExamReportRow,
    ExamComparisonRow,
    ExamPerformanceReport,
    ExamPerformanceRow,
    PopularQuestionsReportRow,
    ReviewerActivityRow,
    SubjectDifficultyCorrelationRow,
    SubjectDifficultyReport,
    ValidatedExamReportRow,
} from '../../../../domains/analytics/schemas/analyticsSchema';
import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { createAnalyticsReportPdf, PdfColumn } from '../../pdf/analyticsPdfService';

type GenericRow = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatDistribution(record: Record<string, unknown>): string {
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
}

function formatAutomaticParameters(params: unknown): string {
    if (!isRecord(params)) return 'Sin detalles';

    const getNumber = (value: unknown): number | null => {
        const num = typeof value === 'number' ? value : Number(value);
        return Number.isFinite(num) ? num : null;
    };

    const typeDistributionCandidate =
        (isRecord(params.questionTypes) && params.questionTypes) ||
        (isRecord(params.typeDistribution) && params.typeDistribution) ||
        (isRecord(params.questionTypeDistribution) && params.questionTypeDistribution) ||
        (isRecord(params.questionTypeProportion) && params.questionTypeProportion) ||
        (isRecord(params.questionTypeCoverage) && params.questionTypeCoverage) ||
        (isRecord(params.questionTypePercentages) && params.questionTypePercentages);
    const typeText = (() => {
        if (!typeDistributionCandidate) return 'sin datos';
        const formatted = formatDistribution(typeDistributionCandidate);
        return formatted || 'sin datos';
    })();

    const topicCoverageCandidate =
        (isRecord(params.topicCoverage) && params.topicCoverage) ||
        (isRecord(params.topics) && params.topics) ||
        (Array.isArray(params.topics) && { topics: params.topics });
    const topicText = (() => {
        if (!topicCoverageCandidate) return 'sin datos';
        if (Array.isArray(topicCoverageCandidate.topics)) {
            const topics = topicCoverageCandidate.topics
                .map((t: unknown) =>
                    isRecord(t)
                        ? String(t.title ?? t.name ?? t.topicName ?? '')
                        : typeof t === 'string'
                          ? t
                          : '',
                )
                .filter(Boolean);
            if (topics.length) return topics.join(', ');
        }
        const distribution = formatDistribution(topicCoverageCandidate);
        if (distribution) return distribution;
        const keys = Object.keys(topicCoverageCandidate);
        return keys.length ? keys.join(', ') : 'sin datos';
    })();

    const total = getNumber(params.totalQuestions ?? params.questionCount);
    const totalText = total !== null ? String(total) : 'sin datos';

    return `Proporción de preguntas por tipo: ${typeText} | Cobertura de temas: ${topicText} | Cantidad total de preguntas: ${totalText}`;
}

type AnalyticsExporterContext = {
    params?: Record<string, string>;
    query?: Record<string, string | string[] | undefined>;
};

type PdfExportConfig = {
    title: string;
    columns: PdfColumn<unknown>[];
    rows: unknown[];
    metadata?: Array<{ label: string; value: string }>;
    layout?: 'portrait' | 'landscape';
    extraTables?: Array<{ title: string; columns: PdfColumn<unknown>[]; rows: unknown[] }>;
};

function formatDate(value: unknown): string {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const REPORT_COLUMNS = {
    automatic: [
        {
            header: 'Título',
            accessor: (row: AutomaticExamReportRow) => row.title,
            width: 2.2,
        },
        {
            header: 'Creador',
            accessor: (row: AutomaticExamReportRow) => row.creatorName ?? 'Sin nombre',
            width: 1.6,
        },
        {
            header: 'Asignatura',
            accessor: (row: AutomaticExamReportRow) => row.subjectName ?? 'Sin asignatura',
            width: 1.6,
        },
        {
            header: 'Creado en',
            accessor: (row: AutomaticExamReportRow) => formatDate(row.createdAt),
            width: 1.4,
        },
        {
            header: 'Parámetros',
            accessor: (row: AutomaticExamReportRow) =>
                row.parameterSummary ?? formatAutomaticParameters(row.parameters),
            width: 2.2,
        },
    ],
    popular: [
        {
            header: 'Pregunta',
            accessor: (row: PopularQuestionsReportRow) =>
                row.questionBody ?? row.topicName ?? 'Sin enunciado',
            width: 2,
        },
        {
            header: 'Tema',
            accessor: (row: PopularQuestionsReportRow) => row.topicName ?? 'Sin tema',
            width: 2,
        },
        {
            header: 'Dificultad',
            accessor: (row: PopularQuestionsReportRow) => row.difficulty,
            width: 1,
        },
        {
            header: 'Usos',
            accessor: (row: PopularQuestionsReportRow) => String(row.usageCount),
            width: 1,
            align: 'right' as const,
        },
    ],
    validated: [
        { header: 'Examen', accessor: (row: ValidatedExamReportRow) => row.title, width: 2 },
        {
            header: 'Asignatura',
            accessor: (row: ValidatedExamReportRow) => row.subjectName ?? 'Sin asignatura',
            width: 1.6,
        },
        {
            header: 'Validado',
            accessor: (row: ValidatedExamReportRow) =>
                row.validatedAt ? formatDate(row.validatedAt) : '-',
            width: 1.6,
        },
        {
            header: 'Observaciones',
            accessor: (row: ValidatedExamReportRow) => row.observations ?? '-',
            width: 3,
        },
    ],
    performance: [
        {
            header: 'Índice',
            accessor: (row: ExamPerformanceRow) => String(row.questionIndex ?? '-'),
            width: 0.8,
            align: 'right',
        },
        {
            header: 'Pregunta',
            accessor: (row: ExamPerformanceRow) =>
                row.questionBody ?? `Pregunta ${row.questionIndex ?? ''}`.trim(),
            width: 2,
        },
        {
            header: 'Dificultad',
            accessor: (row: ExamPerformanceRow) => String(row.difficulty ?? '-'),
            width: 1.2,
        },
        {
            header: 'Éxito %',
            accessor: (row: ExamPerformanceRow) =>
                `${(Number(row.successRate ?? 0) * 100).toFixed(1)}%`,
            width: 1.2,
            align: 'right' as const,
        },
        {
            header: 'Intentos',
            accessor: (row: ExamPerformanceRow) => String(row.attempts ?? '-'),
            width: 1,
            align: 'right' as const,
        },
    ],
    subjectDifficulty: [
        {
            header: 'Asignatura',
            accessor: (row: GenericRow) => String(row.subjectName ?? 'Sin asignatura'),
            width: 2.4,
        },
        {
            header: 'Correlación',
            accessor: (row: GenericRow) => String(row.correlation ?? '-'),
            width: 1,
            align: 'right' as const,
        },
        {
            header: 'Promedios',
            accessor: (row: GenericRow) => String(row.difficulties ?? '-'),
            width: 3,
        },
    ],
    examComparison: [
        { header: 'Examen', accessor: (row: GenericRow) => String(row.title ?? '-'), width: 2.2 },
        {
            header: 'Asignatura',
            accessor: (row: GenericRow) => String(row.subjectName ?? 'Sin asignatura'),
            width: 1.6,
        },
        {
            header: 'Equilibrado',
            accessor: (row: GenericRow) => String(row.balanced ?? '-'),
            width: 1,
        },
        {
            header: 'Brecha',
            accessor: (row: GenericRow) => String(row.balanceGap ?? '-'),
            width: 1,
            align: 'right' as const,
        },
        {
            header: 'Distribución',
            accessor: (row: GenericRow) => String(row.distribution ?? '-'),
            width: 2.2,
        },
        { header: 'Temas', accessor: (row: GenericRow) => String(row.topics ?? '-'), width: 2.5 },
    ],
    reviewerActivity: [
        {
            header: 'Revisor',
            accessor: (row: ReviewerActivityRow) => String(row.reviewerName ?? 'Sin nombre'),
            width: 2,
        },
        {
            header: 'Asignatura',
            accessor: (row: ReviewerActivityRow) => String(row.subjectName ?? 'Sin asignatura'),
            width: 2,
        },
        {
            header: 'Revisados',
            accessor: (row: ReviewerActivityRow) => String(row.reviewedExams ?? '-'),
            width: 1.2,
            align: 'right' as const,
        },
    ],
};

const REPORT_TITLES: Record<AnalyticsReportKey, string> = {
    'automatic-exams': 'Exámenes automáticos generados',
    'popular-questions': 'Preguntas más utilizadas',
    'validated-exams': 'Exámenes validados por revisores',
    'exam-performance': 'Desempeño por examen',
    'subject-difficulty': 'Correlación dificultad / rendimiento',
    'exam-comparison': 'Comparación de exámenes',
    'reviewer-activity': 'Actividad de revisores',
};

const DEFAULT_BALANCE_THRESHOLD = 0.2;

function parseQueryParam(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value ?? null;
}

function buildSubjectDifficultyRows(correlations: SubjectDifficultyCorrelationRow[]): GenericRow[] {
    return correlations.map((entry) => ({
        subjectId: entry.subjectId,
        subjectName: entry.subjectName ?? entry.subjectId,
        correlation: entry.correlationScore.toFixed(2),
        difficulties: entry.difficultyDetails
            .map(
                (detail) =>
                    `${detail.difficulty}: ${
                        detail.averageGrade === null ? 'N/A' : detail.averageGrade.toFixed(1)
                    }`,
            )
            .join(', '),
    }));
}

function buildExamComparisonRows(exams: ExamComparisonRow[]): GenericRow[] {
    return exams.map((row) => ({
        title: row.title,
        subjectName: row.subjectName ?? row.subjectId,
        balanced: row.balanced ? 'Sí' : 'No',
        balanceGap: row.balanceGap.toFixed(2),
        distribution: Object.entries(row.difficultyDistribution)
            .map(([key, value]) => `${key}: ${(value * 100).toFixed(0)}%`)
            .join(', '),
        topics: row.topicDistribution
            .map((topic) => `${topic.topicName ?? 'Sin tema'}: ${topic.questionCount}`)
            .join(', '),
    }));
}

function getThresholdValue(context?: AnalyticsExporterContext): string {
    const raw = context ? parseQueryParam(context.query?.balanceThreshold) : null;
    if (raw !== null) {
        const parsed = Number(raw);
        return Number.isNaN(parsed) ? raw : parsed.toString();
    }
    return DEFAULT_BALANCE_THRESHOLD.toString();
}

export class AnalyticsPdfExporter implements AnalyticsReportExporter {
    async export(
        report: AnalyticsReportKey,
        payload: unknown,
        context?: AnalyticsExporterContext,
    ): Promise<Buffer> {
        const config = this.buildConfig(report, payload, context);
        return createAnalyticsReportPdf(
            config.title,
            config.columns,
            config.rows,
            config.metadata,
            { layout: config.layout, extraTables: config.extraTables },
        );
    }

    private buildConfig(
        report: AnalyticsReportKey,
        payload: unknown,
        context?: AnalyticsExporterContext,
    ): PdfExportConfig {
        switch (report) {
            case 'automatic-exams':
                return this.buildPaginatedConfig(
                    payload as PaginatedSchema<AutomaticExamReportRow>,
                    REPORT_COLUMNS.automatic,
                    REPORT_TITLES[report],
                );
            case 'popular-questions':
                return this.buildPaginatedConfig(
                    payload as PaginatedSchema<PopularQuestionsReportRow>,
                    REPORT_COLUMNS.popular,
                    REPORT_TITLES[report],
                );
            case 'validated-exams':
                return this.buildPaginatedConfig(
                    payload as PaginatedSchema<ValidatedExamReportRow>,
                    REPORT_COLUMNS.validated,
                    REPORT_TITLES[report],
                );
            case 'exam-performance':
                return this.buildPerformanceConfig(payload as ExamPerformanceReport);
            case 'subject-difficulty':
                return this.buildSubjectDifficultyConfig(payload as SubjectDifficultyReport);
            case 'exam-comparison':
                return this.buildExamComparisonConfig(
                    payload as PaginatedSchema<ExamComparisonRow>,
                    context,
                );
            case 'reviewer-activity':
                return this.buildPaginatedConfig(
                    payload as PaginatedSchema<ReviewerActivityRow>,
                    REPORT_COLUMNS.reviewerActivity,
                    REPORT_TITLES[report],
                );
            default:
                throw new Error(`Unsupported report ${report}`);
        }
    }

    private buildPaginatedConfig<T>(
        payload: PaginatedSchema<T>,
        columns: PdfColumn<T>[],
        title: string,
    ): PdfExportConfig {
        return {
            title,
            columns: columns as PdfColumn<unknown>[],
            rows: payload.data as unknown[],
        };
    }

    private buildPerformanceConfig(payload: ExamPerformanceReport): PdfExportConfig {
        return {
            title: REPORT_TITLES['exam-performance'],
            columns: REPORT_COLUMNS.performance as PdfColumn<unknown>[],
            rows: payload.questions,
        };
    }

    private buildSubjectDifficultyConfig(payload: SubjectDifficultyReport): PdfExportConfig {
        const topFailingColumns: PdfColumn<GenericRow>[] = [
            {
                header: 'Pregunta',
                accessor: (row: GenericRow) => String(row.questionBody ?? row.questionId ?? '-'),
                width: 3,
            },
            {
                header: 'Asignatura',
                accessor: (row: GenericRow) => String(row.subjectName ?? 'Sin asignatura'),
                width: 2,
            },
            {
                header: 'Autor',
                accessor: (row: GenericRow) => String(row.authorName ?? 'Sin autor'),
                width: 2,
            },
            {
                header: 'Tasa reprobación',
                accessor: (row: GenericRow) => `${((row.failureRate as number) * 100).toFixed(1)}%`,
                width: 1.4,
                align: 'right' as const,
            },
        ];

        const regradeColumns: PdfColumn<GenericRow>[] = [
            {
                header: 'Asignatura',
                accessor: (row: GenericRow) => String(row.subjectName ?? 'Sin asignatura'),
                width: 2,
            },
            {
                header: 'Curso',
                accessor: (row: GenericRow) => String(row.course ?? '-'),
                width: 1.2,
            },
            {
                header: 'Solicitudes',
                accessor: (row: GenericRow) => String(row.requests ?? '-'),
                width: 1.2,
                align: 'right' as const,
            },
            {
                header: 'Promedio curso',
                accessor: (row: GenericRow) =>
                    row.courseAverage === null ? '-' : (row.courseAverage as number).toFixed(1),
                width: 1.6,
                align: 'right' as const,
            },
            {
                header: 'Promedio recalificados',
                accessor: (row: GenericRow) =>
                    row.regradeAverage === null ? '-' : (row.regradeAverage as number).toFixed(1),
                width: 2,
                align: 'right' as const,
            },
        ];

        return {
            title: REPORT_TITLES['subject-difficulty'],
            columns: REPORT_COLUMNS.subjectDifficulty as PdfColumn<unknown>[],
            rows: buildSubjectDifficultyRows(payload.subjectCorrelations),
            extraTables: [
                {
                    title: 'Preguntas con mayor tasa de reprobación',
                    columns: topFailingColumns as PdfColumn<unknown>[],
                    rows: payload.topFailingQuestions as unknown as GenericRow[],
                },
                {
                    title: 'Comparación de recalificaciones',
                    columns: regradeColumns as PdfColumn<unknown>[],
                    rows: payload.regradeComparison as unknown as GenericRow[],
                },
            ],
        };
    }

    private buildExamComparisonConfig(
        payload: PaginatedSchema<ExamComparisonRow>,
        context?: AnalyticsExporterContext,
    ): PdfExportConfig {
        return {
            title: REPORT_TITLES['exam-comparison'],
            columns: REPORT_COLUMNS.examComparison as PdfColumn<unknown>[],
            rows: buildExamComparisonRows(payload.data),
            metadata: [
                { label: 'Límite', value: String(payload.meta.limit) },
                { label: 'Umbral de equilibrio', value: getThresholdValue(context) },
            ],
            layout: 'landscape',
        };
    }
}
