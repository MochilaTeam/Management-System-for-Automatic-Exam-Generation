import { Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import { getAccessToken } from './helpers/getAccessToken';
import { HttpStatus } from '../../shared/enums/httpStatusEnum';
import { Roles } from '../../shared/enums/rolesEnum';
import { AppError } from '../../shared/exceptions/appError';
import { AuthenticatedRequest } from '../../shared/types/http/AuthenticatedRequest';
import { get_jwt_config } from '../config/jwt';

const JWT_CONFIG = get_jwt_config();

interface ExtendedPayloadWithRolesField extends jwt.JwtPayload {
    roles?: Roles[];
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        const token = getAccessToken(req);
        if (!token) {
            throw new AppError({
                message: 'Missing token',
                statusCode: HttpStatus.UNAUTHORIZED,
            });
        }

        const decoded = jwt.verify(token, JWT_CONFIG.accessSecret, {
            issuer: JWT_CONFIG.issuer,
            audience: JWT_CONFIG.audience,
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
