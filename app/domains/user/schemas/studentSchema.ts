import { z } from 'zod';

import { booleanFromQuery } from './teacherSchema';
import { Roles } from '../../../shared/enums/rolesEnum';

export const studentIdParamsSchema = z
    .object({
        studentId: z.uuid(),
    })
    .strict();

export const createStudentCommandSchema = z
    .object({
        name: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(2)),
        email: z.email().transform((s) => s.trim().toLowerCase()),
        password: z.string().min(8),
        age: z.coerce.number().int().min(0),
        course: z.string().min(1),
    })
    .strict();

export const updateStudentCommandSchema = z
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

        age: z.coerce.number().int().min(0).optional(),
        course: z.string().min(1).optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'Debe enviar al menos un campo para actualizar.',
    });

//Persistence DTOs (hacia repos desde el servicio de Student)
export const studentCreateSchema = z
    .object({
        userId: z.uuid(),
        age: z.coerce.number().int().min(0),
        course: z.string().min(1),
    })
    .strict();

export const studentUpdateSchema = z
    .object({
        age: z.coerce.number().int().min(0).optional(),
        course: z.string().min(1).optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'Debe enviar al menos un campo para actualizar.',
    });

//Read
export const studentReadSchema = z
    .object({
        id: z.uuid(),
        userId: z.uuid(),
        name: z.string(),
        email: z.string().email(),
        role: z.enum(Roles),
        age: z.number().int().min(0),
        course: z.string(),
    })
    .strict();

export const listStudentsQuerySchema = z
    .object({
        role: z.enum(Roles).optional(),
        active: booleanFromQuery.optional(),
        email: z.email().optional(),
        userId: z.uuid().optional(),
        course: z.string().optional(),
        filter: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        offset: z.coerce.number().int().min(0).default(0),
    })
    .strict();

export type StudentIdParams = z.infer<typeof studentIdParamsSchema>;

export type CreateStudent = z.infer<typeof createStudentCommandSchema>;
export type UpdateStudentPayload = z.infer<typeof updateStudentCommandSchema>;

export type StudentCreate = z.infer<typeof studentCreateSchema>;
export type StudentUpdate = z.infer<typeof studentUpdateSchema>;

export type StudentRead = z.infer<typeof studentReadSchema>;
export type ListStudents = z.infer<typeof listStudentsQuerySchema>;
