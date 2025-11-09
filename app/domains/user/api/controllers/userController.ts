import { NextFunction, Request, Response } from 'express';

import {
    makeCreateUserCommand,
    makeDeleteUserCommand,
    makeGetUserByIdQuery,
    makeListUsersQuery,
    makeUpdateUserCommand,
} from '../../../../core/dependencies/user/userDependencies';
import {
    createUserCommandSchema,
    listUsersQuerySchema,
    updateUserCommandSchema,
    userIdParamsSchema,
} from '../../schemas/userSchema';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
    try {
        const dto = listUsersQuerySchema.parse(req.query);
        const result = await makeListUsersQuery().execute(dto);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId } = userIdParamsSchema.parse(req.params);
        const result = await makeGetUserByIdQuery().execute({ userId });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
    try {
        const body = createUserCommandSchema.parse(req.body);
        const result = await makeCreateUserCommand().execute(body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId } = userIdParamsSchema.parse(req.params);
        const patch = updateUserCommandSchema.parse(req.body);
        const result = await makeUpdateUserCommand().execute({ userId, patch });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId } = userIdParamsSchema.parse(req.params);
        await makeDeleteUserCommand().execute({ userId });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
