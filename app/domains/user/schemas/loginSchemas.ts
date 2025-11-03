import { z } from 'zod';

export const loginBodySchema = z.object({
    email: z.email(),
    password: z.string().min(8),
});

export type LoginBodySchema = z.infer<typeof loginBodySchema>;
