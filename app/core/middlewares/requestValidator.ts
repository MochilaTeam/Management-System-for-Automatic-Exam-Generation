import { NextFunction, RequestHandler, Response, Request } from 'express';
import { z } from 'zod';

import { ValidationError } from '../../shared/exceptions/domainErrors';

export type ValidatedReq<B> = Request<unknown, unknown, B, unknown>;

// Middleware interno: valida con el schema y fija req.body como B
const validate_request = <S extends z.ZodTypeAny, B = z.infer<S>>(
    schema: S,
): RequestHandler<unknown, unknown, B, unknown> => {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body as unknown);

        if (!result.success) {
            return next(
                new ValidationError({
                    message: 'Request validation failed',
                    entity: 'Body',
                    details: result.error.issues.map((i) => ({
                        path: i.path.join('.'),
                        message: i.message,
                    })),
                }),
            );
        }

        (req as ValidatedReq<B>).body = result.data as B;
        next();
    };
};

/**
 * Helper público, sin controller genérico:
 * - Recibe un schema (runtime) para validar.
 * - El handler es un handler normal que tú tipeas con el body que quieras (B).
 * - B se puede inferir del handler si no lo pones explícito; si no, cae a z.infer<S>.
 */
export function withValidatedBody<S extends z.ZodTypeAny, B = z.infer<S>>(
    schema: S,
    handler: (
        req: ValidatedReq<B>,
        res: Response,
        next: NextFunction,
    ) => unknown | Promise<unknown>,
): RequestHandler<unknown, unknown, B, unknown> {
    return (req, res, next) => {
        // Nota: pasamos explícitamente <S, B> para mantener el tipo de body
        validate_request<S, B>(schema)(req, res, async (err?: unknown) => {
            if (err) return next(err);
            try {
                await handler(req as ValidatedReq<B>, res, next);
            } catch (e) {
                next(e);
            }
        });
    };
}
