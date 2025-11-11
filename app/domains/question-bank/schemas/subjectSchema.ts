import { z } from 'zod';

// Params
export const subjectIdParamsSchema = z
    .object({
        subjectId: z.string().uuid(),
    })
    .strict();

// Body de API (igual que antes)
export const createSubjectBodySchema = z
    .object({
        subject_program: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(2)),
        subject_name: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(2)),
    })
    .strict();

export const updateSubjectBodySchema = z
    .object({
        subject_program: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(2))
            .optional(),
        subject_name: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(2))
            .optional(),
    })
    .strict()
    .refine((o) => Object.keys(o).length > 0, { message: 'Debe enviar al menos un campo.' });

// DTOs internos hacia repos
export const subjectCreateSchema = z
    .object({
        name: z.string().min(2),
        program: z.string().min(2),
        // ahora el líder es opcional y puede ser null
        leadTeacherId: z.string().uuid().nullable().optional(),
    })
    .strict();

export const subjectUpdateSchema = z
    .object({
        name: z.string().min(2).optional(),
        program: z.string().min(2).optional(),
        // si más adelante permites asignar líder por update, habilita:
        // leadTeacherId: z.string().uuid().nullable().optional(),
    })
    .strict()
    .refine((o) => Object.keys(o).length > 0, { message: 'Debe enviar al menos un campo.' });

// Read (leadTeacherId puede venir null desde la BD)
export const subjectReadSchema = z
    .object({
        id: z.string().uuid(),
        name: z.string(),
        program: z.string(),
        leadTeacherId: z.string().uuid().nullable(),
    })
    .strict();

// Listado
export const listSubjectsQuerySchema = z
    .object({
        q: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .optional(),
        name: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .optional(),
        program: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .optional(),
        leader_id: z.string().uuid().optional(),

        sort_field: z.enum(['createdAt', 'name']).optional(),
        sort_dir: z.enum(['asc', 'desc']).optional(),

        limit: z.coerce.number().int().min(1).max(100).default(20),
        offset: z.coerce.number().int().min(0).default(0),
    })
    .strict();

export const subTopicDetailSchema = z
    .object({
        subtopic_id: z.string(),
        subtopic_name: z.string(),
    })
    .strict();

export const topicDetailSchema = z
    .object({
        topic_id: z.string(),
        topic_name: z.string(),
        subject_id: z.string(),
        subject_name: z.string(),
        subtopics_amount: z.number(),
        subtopics: z.array(subTopicDetailSchema),
    })
    .strict();

export const subjectDetailSchema = z
    .object({
        subject_id: z.string(),
        subject_name: z.string(),
        subject_program: z.string(),
        subject_leader_name: z.string(), // si no hay líder => cadena vacía
        topics_amount: z.number(),
        topics: z.array(topicDetailSchema),
    })
    .strict();

export type SubjectDetail = z.infer<typeof subjectDetailSchema>;
export type TopicDetail = z.infer<typeof topicDetailSchema>;
export type SubTopicDetail = z.infer<typeof subTopicDetailSchema>;
// Types
export type SubjectIdParams = z.infer<typeof subjectIdParamsSchema>;
export type CreateSubjectBody = z.infer<typeof createSubjectBodySchema>;
export type UpdateSubjectBody = z.infer<typeof updateSubjectBodySchema>;
export type SubjectCreate = z.infer<typeof subjectCreateSchema>;
export type SubjectUpdate = z.infer<typeof subjectUpdateSchema>;
export type SubjectRead = z.infer<typeof subjectReadSchema>;
export type ListSubjects = z.infer<typeof listSubjectsQuerySchema>;
