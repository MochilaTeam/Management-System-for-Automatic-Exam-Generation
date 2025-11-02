import {z} from "zod";

const listUsersQuerySchema = z.object({
  role: z.enum(["TEACHER", "STUDENT"]).optional(),
  search: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const userIdParamsSchema = z.object({
  userId: z.string().uuid(),
});

const createUserBodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["TEACHER", "STUDENT"]),
  password: z.string().min(8),
});
