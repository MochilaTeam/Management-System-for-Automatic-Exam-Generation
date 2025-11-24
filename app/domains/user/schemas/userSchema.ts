import { z } from 'zod';

import { Roles } from '../../../shared/enums/rolesEnum';

//Params
export const userIdParamsSchema = z
    .object({
        userId: z.uuid(),
    })
    .strict();

//Comands
export const createUserCommandSchema = z
    .object({
        name: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(2)),
        email: z.email().transform((s) => s.trim().toLowerCase()),
        role: z.enum(Roles),
        password: z.string().min(8),
    })
    .strict();
export const updateUserCommandSchema = z
    .object({
        name: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(2))
            .optional(),
        email: z
            .email()
            .transform((s) => s.trim().toLowerCase())
            .optional(),
        role: z.enum(Roles).optional(),
        password: z.string().min(8).optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'Debe enviar al menos un campo para actualizar.',
    });

//PERSISTENCE DTOs (hacia repos desde el servicio)
export const userCreateSchema = z
    .object({
        name: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(2)),
        email: z.email().transform((s) => s.trim().toLowerCase()),
        role: z.enum(Roles),
        passwordHash: z.string(),
    })
    .strict();

export const userUpdateSchema = z
    .object({
        name: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(2))
            .optional(),
        email: z
            .email()
            .transform((s) => s.trim().toLowerCase())
            .optional(),
        role: z.enum(Roles).optional(),
        passwordHash: z.string().optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'Debe enviar al menos un campo para actualizar.',
    });

//Read
export const userReadSchema = z
    .object({
        id: z.uuid(),
        name: z.string(),
        email: z.email(),
        role: z.enum(Roles),
    })
    .strict();

export const userAuthSchema = z
    .object({
        id: z.uuid(),
        name: z.string(),
        email: z.email(),
        role: z.enum(Roles),
        passwordHash: z.string(),
        active: z.boolean(),
    })
    .strict();

//Queries
export const listUsersQuerySchema = z
    .object({
        role: z.enum(Roles).optional(),
        active: z.boolean().optional(),
        email: z.email().optional(),
        filter: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        offset: z.coerce.number().int().min(0).default(0),
    })
    .strict();

//Responses
export type UserIdParams = z.infer<typeof userIdParamsSchema>;

export type CreateUserCommandSchema = z.infer<typeof createUserCommandSchema>;
export type UpdateUserCommandSchema = z.infer<typeof updateUserCommandSchema>;

export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;

export type UserRead = z.infer<typeof userReadSchema>;
export type UserAuth = z.infer<typeof userAuthSchema>;
export type ListUsers = z.infer<typeof listUsersQuerySchema>;
