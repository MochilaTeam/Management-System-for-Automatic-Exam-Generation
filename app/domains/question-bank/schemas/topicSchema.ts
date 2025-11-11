import { z } from 'zod';

// ===== Read =====
export const subjectRefSchema = z
    .object({
        subject_id: z.string(),
        subject_name: z.string(),
    })
    .strict();

export const topicDetailSchema = z
    .object({
        topic_id: z.string(),
        topic_name: z.string(),
        // relación M:N con Subjects
        subjects_amount: z.number(),
        subjects: z.array(subjectRefSchema),

        // subtemas
        subtopics_amount: z.number(),
        subtopics: z.array(
            z
                .object({
                    subtopic_id: z.string(),
                    subtopic_name: z.string(),
                })
                .strict(),
        ),
    })
    .strict();

export type TopicDetail = z.infer<typeof topicDetailSchema>;
export type SubjectRef = z.infer<typeof subjectRefSchema>;

// ===== Create / Update (payload del front) =====
export const createTopicBodySchema = z
    .object({
        subject_associated_id: z.string().uuid(), // se asocia al menos a 1 subject al crear
        topic_name: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(2)),
    })
    .strict();

export const updateTopicBodySchema = z
    .object({
        // por ahora solo cambio de nombre (las asociaciones se manejarían en endpoints específicos)
        topic_name: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(2))
            .optional(),
    })
    .strict();

export type CreateTopicBody = z.infer<typeof createTopicBodySchema>;
export type UpdateTopicBody = z.infer<typeof updateTopicBodySchema>;

// ===== List query =====
export const listTopicsQuerySchema = z
    .object({
        q: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .optional(),
        subject_id: z.string().uuid().optional(), // filtrar por subject asociado
        limit: z.coerce.number().int().min(1).max(100).default(20),
        offset: z.coerce.number().int().min(0).default(0),
    })
    .strict();
export type ListTopics = z.infer<typeof listTopicsQuerySchema>;

// ===== DTOs hacia repos =====
export const topicCreateSchema = z
    .object({
        title: z.string().min(2),
        firstSubjectId: z.string().uuid(), // para crear y asociar en la pivot
    })
    .strict();

export const topicUpdateSchema = z
    .object({
        title: z.string().min(2).optional(),
    })
    .strict();

export type TopicCreate = z.infer<typeof topicCreateSchema>;
export type TopicUpdate = z.infer<typeof topicUpdateSchema>;
