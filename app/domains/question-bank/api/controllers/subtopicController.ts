import { NextFunction, Request, Response } from 'express';

import {
    makeCreateSubtopicCommand,
    makeDeleteSubtopicCommand,
    makeGetSubtopicByIdQuery,
    makeListSubtopicsQuery,
} from '../../../../core/dependencies/question-bank/subtopicDependencies';
import {
    subtopicIdParamsSchema,
    listSubtopicsQuerySchema,
    createSubtopicBodySchema,
} from '../../schemas/subtopicSchema';

export async function listSubtopics(req: Request, res: Response, next: NextFunction) {
    try {
        const dto = listSubtopicsQuerySchema.parse(req.query);
        const result = await makeListSubtopicsQuery().execute(dto);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getSubtopicById(req: Request, res: Response, next: NextFunction) {
    try {
        const { subtopicId } = subtopicIdParamsSchema.parse(req.params);
        const result = await makeGetSubtopicByIdQuery().execute({ subtopicId });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function createSubtopic(req: Request, res: Response, next: NextFunction) {
    try {
        const body = createSubtopicBodySchema.parse(req.body);
        const result = await makeCreateSubtopicCommand().execute(body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function deleteSubtopic(req: Request, res: Response, next: NextFunction) {
    try {
        const { subtopicId } = subtopicIdParamsSchema.parse(req.params);
        await makeDeleteSubtopicCommand().execute({ subtopicId });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
