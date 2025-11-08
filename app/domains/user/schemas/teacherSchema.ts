import { z } from "zod";
import { Roles } from "../../../shared/enums/rolesEnum";

//Params
export const teacherIdParamsSchema = z
  .object({
    teacherId: z.uuid(),
  })
  .strict();

//Comands
export const createTeacherCommandSchema = z
  .object({
    name: z.string().transform((s) => s.trim()).pipe(z.string().min(2)),
    email: z.email().transform((s) => s.trim().toLowerCase()),
    role: z.enum(Roles),
    password: z.string().min(8),
  })
  .strict();
export const updateTeacherCommandSchema = z
  .object({
    name: z.string().transform((s) => s.trim()).pipe(z.string().min(2)).optional(),
    email: z.email().transform((s) => s.trim().toLowerCase()).optional(),
    role: z.enum(Roles).optional,
    passwordHash: z.string().optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Debe enviar al menos un campo para actualizar.",
  });

//PERSISTENCE DTOs (hacia repos desde el servicio)
export const teacherCreateSchema = z
  .object({
    name: z.string().transform((s) => s.trim()).pipe(z.string().min(2)),
    email: z.email().transform((s) => s.trim().toLowerCase()),
    passwordHash: z.string(),
  })
  .strict();

export const teacherUpdateSchema = z
  .object({
    name: z.string().transform((s) => s.trim()).pipe(z.string().min(2)).optional(),
    email: z.email().transform((s) => s.trim().toLowerCase()).optional(),
    passwordHash: z.string().optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Debe enviar al menos un campo para actualizar.",
  });

//Read
export const teacherReadSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    email: z.email(),
  })
  .strict();

export const readTeacherWithRoleSchema = teacherReadSchema
  .extend({
    role: z.enum(Roles),
  })
  .strict();

//Queries
export const listTeachersQuerySchema = z
  .object({
    role: z.enum(Roles).optional(),
    active: z.boolean().optional(),
    email: z.email().optional(),
    filter: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1))
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();

//Responses
export const listTeachersResponseSchema = z.object({
  data: z.array(teacherReadSchema),
  meta: z.object({
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    total: z.number().int().min(0),
  }).strict(),
}).strict();


export type TeacherIdParams = z.infer<typeof teacherIdParamsSchema>;

export type CreateTeacherCommand = z.infer<typeof createTeacherCommandSchema>;
export type UpdateTeacherCommand = z.infer<typeof updateTeacherCommandSchema>;

export type TeacherCreate = z.infer<typeof teacherCreateSchema>;
export type TeacherUpdate = z.infer<typeof teacherUpdateSchema>;

export type TeacherRead = z.infer<typeof teacherReadSchema>;
export type TeacherReadWithRole = z.infer<typeof readTeacherWithRoleSchema>;
export type ListTeachers = z.infer<typeof listTeachersQuerySchema>;
export type ListTeachersResponse = z.infer<typeof listTeachersResponseSchema>;
