import { NextFunction, Request, Response } from 'express';

import {
    makeCompareExamsReportQuery,
    makeGetExamPerformanceReportQuery,
    makeGetSubjectDifficultyReportQuery,
    makeListAutomaticExamsReportQuery,
    makeListPopularQuestionsReportQuery,
    makeListReviewerActivityReportQuery,
    makeListValidatedExamsReportQuery,
    makeAnalyticsReportExporter,
} from '../../../../core/dependencies/analytics/analyticsDependencies';
import { AnalyticsReportKey } from '../../application/ports/AnalyticsReportExporter';
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
} from '../../schemas/analyticsSchema';

const analyticsReportExporter = makeAnalyticsReportExporter();

const PDF_FILENAMES: Record<AnalyticsReportKey, string> = {
    'automatic-exams': 'automatic-exams.pdf',
    'popular-questions': 'popular-questions.pdf',
    'validated-exams': 'validated-exams.pdf',
    'exam-performance': 'exam-performance.pdf',
    'subject-difficulty': 'subject-difficulty.pdf',
    'exam-comparison': 'exam-comparison.pdf',
    'reviewer-activity': 'reviewer-activity.pdf',
};

async function respondWithPdf(
    report: AnalyticsReportKey,
    result: unknown,
    req: Request,
    res: Response,
) {
    const buffer = await analyticsReportExporter.export(report, result, {
        params: req.params as Record<string, string>,
        query: req.query as Record<string, string | string[] | undefined>,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${PDF_FILENAMES[report]}`);
    res.send(buffer);
}

export async function listAutomaticExams(_req: Request, res: Response, next: NextFunction) {
    try {
        const dto = automaticExamReportRequestSchema.parse(_req.query);
        const { format, ...payload } = dto;
        const isPdf = format === ReportFormatEnum.PDF;
        const queryPayload = isPdf ? { ...payload, exportAll: true } : payload;
        const result = await makeListAutomaticExamsReportQuery().execute(queryPayload);
        if (isPdf) {
            await respondWithPdf('automatic-exams', result, _req, res);
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
        const isPdf = format === ReportFormatEnum.PDF;
        const queryPayload = isPdf ? { ...payload, exportAll: true } : payload;
        const result = await makeListPopularQuestionsReportQuery().execute(queryPayload);
        if (isPdf) {
            await respondWithPdf('popular-questions', result, _req, res);
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
        const isPdf = format === ReportFormatEnum.PDF;
        const queryPayload = isPdf ? { ...payload, exportAll: true } : payload;
        const result = await makeListValidatedExamsReportQuery().execute(queryPayload);
        if (isPdf) {
            await respondWithPdf('validated-exams', result, _req, res);
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
            await respondWithPdf('exam-performance', result, req, res);
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
        const isPdf = format === ReportFormatEnum.PDF;
        const queryPayload = isPdf ? { ...payload, exportAll: true } : payload;
        const result = await makeGetSubjectDifficultyReportQuery().execute(queryPayload);
        if (isPdf) {
            await respondWithPdf('subject-difficulty', result, _req, res);
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
        const isPdf = format === ReportFormatEnum.PDF;
        const queryPayload = isPdf ? { ...payload, exportAll: true } : payload;
        const result = await makeCompareExamsReportQuery().execute(queryPayload);
        if (isPdf) {
            await respondWithPdf('exam-comparison', result, _req, res);
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
        const isPdf = format === ReportFormatEnum.PDF;
        const queryPayload = isPdf ? { ...payload, exportAll: true } : payload;
        const result = await makeListReviewerActivityReportQuery().execute(queryPayload);
        if (isPdf) {
            await respondWithPdf('reviewer-activity', result, _req, res);
            return;
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
}
