import { NextFunction, Request, Response } from 'express';

import {
    makeCreateSubjectTopicCommand,
    makeCreateTopicCommand,
    makeDeleteTopicCommand,
    makeGetTopicByIdQuery,
    makeListTopicsQuery,
    makeUpdateTopicCommand,
} from '../../../../core/dependencies/question-bank/topicDependencies';
import { createSubjectTopicBodySchema } from '../../schemas/subjectTopicSchema';
import {
    createTopicBodySchema,
    listTopicsQuerySchema,
    updateTopicBodySchema,
} from '../../schemas/topicSchema';

export async function listTopics(req: Request, res: Response, next: NextFunction) {
    try {
        const dto = listTopicsQuerySchema.parse(req.query);
        const result = await makeListTopicsQuery().execute(dto);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getTopicById(req: Request, res: Response, next: NextFunction) {
    try {
        const { topicId } = req.params as { topicId: string };
        const result = await makeGetTopicByIdQuery().execute({ topicId });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function createTopic(req: Request, res: Response, next: NextFunction) {
    try {
        const body = createTopicBodySchema.parse(req.body);
        const result = await makeCreateTopicCommand().execute(body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function createSubjectTopic(req: Request, res: Response, next: NextFunction) {
    try {
        const body = createSubjectTopicBodySchema.parse(req.body);
        const result = await makeCreateSubjectTopicCommand().execute(body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function updateTopic(req: Request, res: Response, next: NextFunction) {
    try {
        const { topicId } = req.params as { topicId: string };
        const patch = updateTopicBodySchema.parse(req.body);
        const result = await makeUpdateTopicCommand().execute({ topicId, patch });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function deleteTopic(req: Request, res: Response, next: NextFunction) {
    try {
        const { topicId } = req.params as { topicId: string };
        await makeDeleteTopicCommand().execute({ topicId });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
