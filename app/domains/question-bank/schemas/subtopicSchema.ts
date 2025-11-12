import { z } from 'zod';

// Params
export const subtopicIdParamsSchema = z
    .object({
        subtopicId: z.string().uuid(),
    })
    .strict();

// Body (frontend)
export const createSubtopicBodySchema = z
    .object({
        topic_associated_id: z.string().uuid(),
        subtopic_name: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(2)),
    })
    .strict();

// Read (detalle que pide el front: incluye topic_name)
export const subtopicDetailSchema = z
    .object({
        subtopic_id: z.string(),
        subtopic_name: z.string(),
        topic_id: z.string(),
        topic_name: z.string(),
    })
    .strict();
export type SubtopicDetail = z.infer<typeof subtopicDetailSchema>;

// List query
export const listSubtopicsQuerySchema = z
    .object({
        q: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .optional(),
        topic_id: z.string().uuid().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        offset: z.coerce.number().int().min(0).default(0),
    })
    .strict();
export type ListSubtopics = z.infer<typeof listSubtopicsQuerySchema>;

// DTOs hacia repos
export const subtopicCreateSchema = z
    .object({
        topicId: z.string().uuid(),
        name: z.string().min(2),
    })
    .strict();
export type SubtopicCreate = z.infer<typeof subtopicCreateSchema>;
