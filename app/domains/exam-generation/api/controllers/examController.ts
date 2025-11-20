import { NextFunction, Request, Response } from 'express';

import {
    makeCreateAutomaticExamCommand,
    makeCreateManualExamCommand,
    makeDeleteExamCommand,
    makeGetExamByIdQuery,
    makeListExamsQuery,
    makeUpdateExamCommand,
} from '../../../../core/dependencies/exam-application/examDependencies';
import {
    createAutomaticExamCommandSchema,
    createManualExamCommandSchema,
    examIdParamsSchema,
    listExamsQuerySchema,
    updateExamCommandSchema,
} from '../../schemas/examSchema';

export async function listExams(req: Request, res: Response, next: NextFunction) {
    try {
        const dto = listExamsQuerySchema.parse(req.query);
        const result = await makeListExamsQuery().execute(dto);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getExamById(req: Request, res: Response, next: NextFunction) {
    try {
        const { examId } = examIdParamsSchema.parse(req.params);
        const result = await makeGetExamByIdQuery().execute({ examId });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function createManualExam(req: Request, res: Response, next: NextFunction) {
    try {
        const body = createManualExamCommandSchema.parse(req.body);
        const result = await makeCreateManualExamCommand().execute(body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function createAutomaticExam(req: Request, res: Response, next: NextFunction) {
    try {
        const body = createAutomaticExamCommandSchema.parse(req.body);
        const result = await makeCreateAutomaticExamCommand().execute(body);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function updateExam(req: Request, res: Response, next: NextFunction) {
    try {
        const { examId } = examIdParamsSchema.parse(req.params);
        const patch = updateExamCommandSchema.parse(req.body);
        const result = await makeUpdateExamCommand().execute({ examId, patch });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function deleteExam(req: Request, res: Response, next: NextFunction) {
    try {
        const { examId } = examIdParamsSchema.parse(req.params);
        await makeDeleteExamCommand().execute({ examId });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
