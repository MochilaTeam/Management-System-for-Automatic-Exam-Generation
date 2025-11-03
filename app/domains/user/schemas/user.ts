import {z} from "zod";
import { Roles } from "../../../shared/enums/rolesEnum";

export const listUsersQuerySchema = z.object({
  role: z.enum(Roles).optional(),
  search: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const userIdParamsSchema = z.object({
  userId: z.string().uuid(),
});

export const createUserBodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(Roles),
  password: z.string().min(8),
});
