import { z } from 'zod';

export const createSubjectTopicBodySchema = z
    .object({
        subject_id: z.string().uuid(),
        topic_id: z.string().uuid(),
    })
    .strict();
export type CreateSubjectTopicBody = z.infer<typeof createSubjectTopicBodySchema>;
