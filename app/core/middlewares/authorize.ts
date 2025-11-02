import type { Request, Response, NextFunction } from 'express';

import { HttpStatus } from '../../shared/enums/httpStatusEnum';
import type { Roles } from '../../shared/enums/rolesEnum';
import { AppError } from '../../shared/exceptions/appError';

function getAppError(message: string, statusCode: HttpStatus): AppError {
    return new AppError({
        message: message,
        statusCode: statusCode,
        entity: 'Auth',
    });
}

//Requiere que el usuario tenga AL MENOS uno de los roles indicados.
export function requireRoles(...allowed: Roles[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) {
            throw getAppError('Unauthenticated', HttpStatus.UNAUTHORIZED);
        }

        const userRoles = user.roles ?? [];

        const hasAny = userRoles.some((r) => allowed.includes(r));
        if (!hasAny) throw getAppError('Forbidden', HttpStatus.FORBIDDEN);

        return next();
    };
}

//Requiere que el usuario tenga TODOS los roles indicados.
export function requireAllRoles(...required: Roles[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) throw getAppError('Unauthenticated', HttpStatus.UNAUTHORIZED);

        const userRoles = user.roles ?? [];

        const hasAll = required.every((r) => userRoles.includes(r));
        if (!hasAll) throw getAppError('Forbidden', HttpStatus.FORBIDDEN);

        return next();
    };
}
