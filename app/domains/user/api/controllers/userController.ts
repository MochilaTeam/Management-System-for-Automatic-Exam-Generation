import { NextFunction, Request, Response } from 'express';

import {
    makeCreateUserCommand,
    makeDeleteUserCommand,
    makeGetUserByIdQuery,
    makeListUsersQuery,
    makeUpdateUserCommand,
} from '../../../../core/dependencies/user/userDependencies';
import { BaseErrorResponse } from '../../../../shared/domain/base_response';
import { HttpStatus } from '../../../../shared/enums/httpStatusEnum';
import { AppError } from '../../../../shared/exceptions/appError';
import { AuthenticatedRequest } from '../../../../shared/types/http/AuthenticatedRequest';
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

export async function deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const { userId } = userIdParamsSchema.parse(req.params);
        const currentUserId = req.user?.id;

        if (!currentUserId) {
            throw new AppError({
                message: 'Usuario no autenticado',
                statusCode: HttpStatus.UNAUTHORIZED,
            });
        }

        if (currentUserId === userId) {
            return res
                .status(HttpStatus.FORBIDDEN)
                .json(
                    new BaseErrorResponse(
                        'No puedes eliminar tu propio usuario',
                        'CANNOT_DELETE_SELF',
                        HttpStatus.FORBIDDEN,
                    ),
                );
        }

        await makeDeleteUserCommand().execute({ userId });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            throw new AppError({
                message: 'Authenticated user not found in context',
                statusCode: HttpStatus.UNAUTHORIZED,
            });
        }

        const result = await makeGetUserByIdQuery().execute({ userId });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}
