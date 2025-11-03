import { z } from "zod";
import { Roles } from "../../../shared/enums/rolesEnum";

export const userIdParamsSchema = z.object({
  userId: z.uuid(),                    
}).strict();

export const listUsersQuerySchema = z.object({
  role: z.enum(Roles).optional(),
  search: z.string().transform((s) => s.trim()).pipe(z.string().min(1)).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
}).strict();

export const createUserBodySchema = z.object({
  name: z.string().transform((s) => s.trim()).pipe(z.string().min(2)),
  email: z.email().transform((s) => s.trim().toLowerCase()),
  role: z.enum(Roles),
  password: z.string().min(8),
}).strict();

export const updateUserBodySchema = z.object({
  name: z.string().transform((s) => s.trim()).pipe(z.string().min(2)).optional(),
  role: z.enum(Roles).optional(),
  active: z.coerce.boolean().optional(),
})
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Debe enviar al menos un campo para actualizar.",
  });

export const userPublicSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  role: z.enum(Roles),         
  active: z.boolean(),
}).strict();

export const listUsersResponseSchema = z.object({
  data: z.array(userPublicSchema),
  meta: z.object({
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    total: z.number().int().min(0),
  }).strict(),
}).strict();

export const userResponseSchema = z.object({
  data: userPublicSchema,
  meta: z.object({}).strict(),
}).strict();

// export const errorResponseSchema = z.object({
//   error: z.object({
//     code: z.string(),
//     message: z.string(),
//     details: z.any().optional(),
//   }).strict(),
// }).strict();

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
