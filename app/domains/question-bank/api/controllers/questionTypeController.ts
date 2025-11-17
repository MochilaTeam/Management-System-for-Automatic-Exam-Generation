// src/interfaces/http/controllers/questionTypeController.ts
import { NextFunction, Request, Response } from 'express';

import {
    makeCreateQuestionTypeCommand,
    makeDeleteQuestionTypeCommand,
    makeGetQuestionTypeByIdQuery,
    makeListQuestionTypesQuery,
    makeUpdateQuestionTypeCommand,
} from '../../../../core/dependencies/question-bank/questionTypeDependencies';
import {
    createQuestionTypeCommandSchema,
    listQuestionTypesQuerySchema,
    questionTypeIdParamsSchema,
    updateQuestionTypeCommandSchema,
} from '../../schemas/questionTypeSchema';

export async function listQuestionTypes(req: Request, res: Response, next: NextFunction) {
    try {
        const dto = listQuestionTypesQuerySchema.parse(req.query);
        const result = await makeListQuestionTypesQuery().execute(dto);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getQuestionTypeById(req: Request, res: Response, next: NextFunction) {
    try {
        const { questionTypeId } = questionTypeIdParamsSchema.parse(req.params);
        const result = await makeGetQuestionTypeByIdQuery().execute({ questionTypeId });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function createQuestionType(req: Request, res: Response, next: NextFunction) {
    try {
        const body = createQuestionTypeCommandSchema.parse(req.body);
        const result = await makeCreateQuestionTypeCommand().execute(body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function updateQuestionType(req: Request, res: Response, next: NextFunction) {
    try {
        const { questionTypeId } = questionTypeIdParamsSchema.parse(req.params);
        const patch = updateQuestionTypeCommandSchema.parse(req.body);
        const result = await makeUpdateQuestionTypeCommand().execute({ questionTypeId, patch });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function deleteQuestionType(req: Request, res: Response, next: NextFunction) {
    try {
        const { questionTypeId } = questionTypeIdParamsSchema.parse(req.params);
        await makeDeleteQuestionTypeCommand().execute({ questionTypeId });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
