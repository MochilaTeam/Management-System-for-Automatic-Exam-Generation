import { z } from 'zod';

import { QuestionTypeEnum } from '../entities/enums/QuestionType';

// Params
export const questionTypeIdParamsSchema = z
    .object({
        questionTypeId: z.string().uuid(),
    })
    .strict();

// Commands
export const createQuestionTypeCommandSchema = z
    .object({
        name: z.nativeEnum(QuestionTypeEnum),
    })
    .strict();

export const updateQuestionTypeCommandSchema = z
    .object({
        name: z.nativeEnum(QuestionTypeEnum).optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'Debe enviar al menos un campo para actualizar.',
    });

// PERSISTENCE DTOs (hacia repos desde el servicio)
export const questionTypeCreateSchema = z
    .object({
        name: z.nativeEnum(QuestionTypeEnum),
    })
    .strict();

export const questionTypeUpdateSchema = z
    .object({
        name: z.nativeEnum(QuestionTypeEnum).optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'Debe enviar al menos un campo para actualizar.',
    });

// Read
export const questionTypeReadSchema = z
    .object({
        id: z.string().uuid(),
        name: z.nativeEnum(QuestionTypeEnum),
    })
    .strict();

// Queries
export const listQuestionTypesQuerySchema = z
    .object({
        limit: z.coerce.number().int().min(1).max(100).default(20),
        offset: z.coerce.number().int().min(0).default(0),
    })
    .strict();

// Types
export type QuestionTypeIdParams = z.infer<typeof questionTypeIdParamsSchema>;

export type CreateQuestionTypeCommandSchema = z.infer<typeof createQuestionTypeCommandSchema>;
export type UpdateQuestionTypeCommandSchema = z.infer<typeof updateQuestionTypeCommandSchema>;

export type QuestionTypeCreate = z.infer<typeof questionTypeCreateSchema>;
export type QuestionTypeUpdate = z.infer<typeof questionTypeUpdateSchema>;
export type QuestionTypeRead = z.infer<typeof questionTypeReadSchema>;
export type ListQuestionTypes = z.infer<typeof listQuestionTypesQuerySchema>;
