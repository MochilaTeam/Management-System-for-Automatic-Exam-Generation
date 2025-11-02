import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import { getAccessToken } from './helpers/getAccessToken';
import { HttpStatus } from '../../shared/enums/httpStatusEnum';
import { Roles } from '../../shared/enums/rolesEnum';
import { AppError } from '../../shared/exceptions/appError';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;

if (!ACCESS_SECRET || !JWT_ISSUER || !JWT_AUDIENCE) {
    throw new Error('JWT config missing: JWT_ACCESS_SECRET / JWT_ISSUER / JWT_AUDIENCE');
}

interface ExtendedPayloadWithRolesField extends jwt.JwtPayload {
    roles?: Roles[];
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        const token = getAccessToken(req);
        if (!token) {
            throw new AppError({
                message: 'Missing token',
                statusCode: HttpStatus.UNAUTHORIZED,
            });
        }

        const decoded = jwt.verify(token, ACCESS_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        }) as ExtendedPayloadWithRolesField;

        if (!decoded || typeof decoded !== 'object' || !decoded.sub) {
            throw new AppError({
                message: 'Invalid token payload',
                statusCode: HttpStatus.UNAUTHORIZED,
            });
        }

        req.user = {
            id: String(decoded.sub),
            roles: Array.isArray(decoded.roles) ? decoded.roles : [],
        };

        return next();
    } catch (err: unknown) {
        let message = 'Unauthorized';

        if (err instanceof TokenExpiredError) message = 'Token expired';
        else if (err instanceof JsonWebTokenError) message = 'Invalid token';

        throw new AppError({
            message,
            statusCode: HttpStatus.UNAUTHORIZED,
        });
    }
}
