import { NextFunction, Request, Response } from 'express';

import {
    makeListAutomaticExamsReportQuery,
    makeListPopularQuestionsReportQuery,
    makeListValidatedExamsReportQuery,
    makeGetExamPerformanceReportQuery,
    makeGetSubjectDifficultyReportQuery,
    makeCompareExamsReportQuery,
    makeListReviewerActivityReportQuery,
} from '../../../../core/dependencies/analytics/analyticsDependencies';
import {
    PdfColumn,
    createAnalyticsReportPdf,
} from '../../../../infrastructure/analytics/pdf/analyticsPdfService';
import { ReportFormatEnum } from '../../entities/enums/ReportFormatEnum';
import {
    automaticExamReportRequestSchema,
    examComparisonReportRequestSchema,
    examPerformanceParamsSchema,
    examPerformanceRequestSchema,
    popularQuestionsReportRequestSchema,
    reviewerActivityReportRequestSchema,
    subjectDifficultyReportRequestSchema,
    validatedExamsReportRequestSchema,
    AutomaticExamReportRow,
    PopularQuestionsReportRow,
    ValidatedExamReportRow,
} from '../../schemas/analyticsSchema';

type GenericRow = Record<string, unknown>;

const REPORT_COLUMNS = {
    automatic: [
        {
            header: 'Título',
            accessor: (row: AutomaticExamReportRow) => row.title,
        },
        {
            header: 'Creador',
            accessor: (row: AutomaticExamReportRow) => row.creatorName ?? row.creatorId,
        },
        {
            header: 'Asignatura',
            accessor: (row: AutomaticExamReportRow) => row.subjectName ?? row.subjectId,
        },
        {
            header: 'Creado en',
            accessor: (row: AutomaticExamReportRow) =>
                row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        },
        {
            header: 'Parámetros',
            accessor: (row: AutomaticExamReportRow) => JSON.stringify(row.parameters ?? {}),
        },
    ],
    popular: [
        { header: 'Pregunta', accessor: (row: PopularQuestionsReportRow) => row.questionId },
        {
            header: 'Tema',
            accessor: (row: PopularQuestionsReportRow) => row.topicName ?? 'Sin tema',
        },
        { header: 'Dificultad', accessor: (row: PopularQuestionsReportRow) => row.difficulty },
        {
            header: 'Usos',
            accessor: (row: PopularQuestionsReportRow) => String(row.usageCount),
        },
    ],
    validated: [
        { header: 'Examen', accessor: (row: ValidatedExamReportRow) => row.title },
        {
            header: 'Asignatura',
            accessor: (row: ValidatedExamReportRow) => row.subjectName ?? row.subjectId,
        },
        {
            header: 'Validado',
            accessor: (row: ValidatedExamReportRow) =>
                row.validatedAt ? new Date(row.validatedAt).toISOString() : '-',
        },
        {
            header: 'Observaciones',
            accessor: (row: ValidatedExamReportRow) => row.observations ?? '-',
        },
    ],
    performance: [
        { header: 'Índice', accessor: (row: GenericRow) => String(row.questionIndex ?? '-') },
        { header: 'Pregunta', accessor: (row: GenericRow) => String(row.questionId ?? '-') },
        { header: 'Dificultad', accessor: (row: GenericRow) => String(row.difficulty ?? '-') },
        {
            header: 'Éxito %',
            accessor: (row: GenericRow) => `${(Number(row.successRate ?? 0) * 100).toFixed(1)}%`,
        },
        { header: 'Intentos', accessor: (row: GenericRow) => String(row.attempts ?? '-') },
    ],
    subjectDifficulty: [
        {
            header: 'Asignatura',
            accessor: (row: GenericRow) => String(row.subjectName ?? row.subjectId ?? '-'),
        },
        { header: 'Correlación', accessor: (row: GenericRow) => String(row.correlation ?? '-') },
        { header: 'Promedios', accessor: (row: GenericRow) => String(row.difficulties ?? '-') },
    ],
    examComparison: [
        { header: 'Examen', accessor: (row: GenericRow) => String(row.title ?? '-') },
        {
            header: 'Asignatura',
            accessor: (row: GenericRow) => String(row.subjectName ?? row.subjectId ?? '-'),
        },
        {
            header: 'Equilibrado',
            accessor: (row: GenericRow) => (row.balanced ? 'Sí' : 'No'),
        },
        { header: 'Brecha', accessor: (row: GenericRow) => String(row.balanceGap ?? '-') },
        { header: 'Distribución', accessor: (row: GenericRow) => String(row.distribution ?? '-') },
        { header: 'Temas', accessor: (row: GenericRow) => String(row.topics ?? '-') },
    ],
    reviewerActivity: [
        {
            header: 'Revisor',
            accessor: (row: GenericRow) => String(row.reviewerName ?? row.reviewerId ?? '-'),
        },
        {
            header: 'Asignatura',
            accessor: (row: GenericRow) => String(row.subjectName ?? row.subjectId ?? '-'),
        },
        {
            header: 'Revisados',
            accessor: (row: GenericRow) => String(row.reviewedExams ?? '-'),
        },
    ],
};

async function sendReportPdf<T>(
    res: Response,
    title: string,
    columns: PdfColumn<T>[],
    rows: T[],
    filename: string,
    metadata?: Array<{ label: string; value: string }>,
) {
    const buffer = await createAnalyticsReportPdf(title, columns, rows, metadata);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
}

export async function listAutomaticExams(_req: Request, res: Response, next: NextFunction) {
    try {
        const dto = automaticExamReportRequestSchema.parse(_req.query);
        const { format, ...payload } = dto;
        const result = await makeListAutomaticExamsReportQuery().execute(payload);
        if (format === ReportFormatEnum.PDF) {
            await sendReportPdf(
                res,
                'Exámenes automáticos generados',
                REPORT_COLUMNS.automatic,
                result.data,
                'automatic-exams.pdf',
            );
            return;
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function listPopularQuestions(_req: Request, res: Response, next: NextFunction) {
    try {
        const dto = popularQuestionsReportRequestSchema.parse(_req.query);
        const { format, ...payload } = dto;
        const result = await makeListPopularQuestionsReportQuery().execute(payload);
        if (format === ReportFormatEnum.PDF) {
            await sendReportPdf(
                res,
                'Preguntas más utilizadas',
                REPORT_COLUMNS.popular,
                result.data,
                'popular-questions.pdf',
            );
            return;
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function listValidatedExams(_req: Request, res: Response, next: NextFunction) {
    try {
        const dto = validatedExamsReportRequestSchema.parse(_req.query);
        const { format, ...payload } = dto;
        const result = await makeListValidatedExamsReportQuery().execute(payload);
        if (format === ReportFormatEnum.PDF) {
            await sendReportPdf(
                res,
                'Exámenes validados por revisores',
                REPORT_COLUMNS.validated,
                result.data,
                'validated-exams.pdf',
            );
            return;
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function getExamPerformance(req: Request, res: Response, next: NextFunction) {
    try {
        const params = examPerformanceParamsSchema.parse(req.params);
        const query = examPerformanceRequestSchema.parse(req.query);
        const result = await makeGetExamPerformanceReportQuery().execute(params);
        if (query.format === ReportFormatEnum.PDF) {
            await sendReportPdf(
                res,
                'Desempeño por examen',
                REPORT_COLUMNS.performance,
                result.questions,
                'exam-performance.pdf',
            );
            return;
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function getSubjectDifficulty(_req: Request, res: Response, next: NextFunction) {
    try {
        const dto = subjectDifficultyReportRequestSchema.parse(_req.query);
        const { format, ...payload } = dto;
        const result = await makeGetSubjectDifficultyReportQuery().execute(payload);
        if (format === ReportFormatEnum.PDF) {
            const pdfRows = result.subjectCorrelations.map((entry) => ({
                subjectName: entry.subjectName ?? entry.subjectId,
                correlation: entry.correlationScore.toFixed(2),
                difficulties: entry.difficultyDetails
                    .map(
                        (detail) =>
                            `${detail.difficulty}: ${
                                detail.averageGrade === null
                                    ? 'N/A'
                                    : detail.averageGrade.toFixed(1)
                            }`,
                    )
                    .join(', '),
            }));
            await sendReportPdf(
                res,
                'Correlación dificultad / rendimiento',
                REPORT_COLUMNS.subjectDifficulty,
                pdfRows,
                'subject-difficulty.pdf',
            );
            return;
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function compareExams(_req: Request, res: Response, next: NextFunction) {
    try {
        const dto = examComparisonReportRequestSchema.parse(_req.query);
        const { format, ...payload } = dto;
        const result = await makeCompareExamsReportQuery().execute(payload);
        if (format === ReportFormatEnum.PDF) {
            const pdfRows = result.data.map((row) => ({
                title: row.title,
                subjectName: row.subjectName ?? row.subjectId,
                balanced: row.balanced,
                balanceGap: row.balanceGap.toFixed(2),
                distribution: Object.entries(row.difficultyDistribution)
                    .map(([key, value]) => `${key}: ${(value * 100).toFixed(0)}%`)
                    .join(', '),
                topics: row.topicDistribution
                    .map((topic) => `${topic.topicName ?? 'Sin tema'}: ${topic.questionCount}`)
                    .join(', '),
            }));
            await sendReportPdf(
                res,
                'Comparación de exámenes',
                REPORT_COLUMNS.examComparison,
                pdfRows,
                'exam-comparison.pdf',
                [
                    { label: 'Límite', value: String(payload.limit) },
                    { label: 'Umbral de equilibrio', value: payload.balanceThreshold.toString() },
                ],
            );
            return;
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function listReviewerActivity(_req: Request, res: Response, next: NextFunction) {
    try {
        const dto = reviewerActivityReportRequestSchema.parse(_req.query);
        const { format, ...payload } = dto;
        const result = await makeListReviewerActivityReportQuery().execute(payload);
        if (format === ReportFormatEnum.PDF) {
            await sendReportPdf(
                res,
                'Actividad de revisores',
                REPORT_COLUMNS.reviewerActivity,
                result.data,
                'reviewer-activity.pdf',
            );
            return;
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
}
