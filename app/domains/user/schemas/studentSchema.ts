import { z } from "zod";
import { Roles } from "../../../shared/enums/rolesEnum";

export const studentIdParamsSchema = z
  .object({
    studentId: z.uuid(),
  })
  .strict();

export const createStudentCommandSchema = z
  .object({
    name: z.string().transform((s) => s.trim()).pipe(z.string().min(2)),
    email: z.email().transform((s) => s.trim().toLowerCase()),
    password: z.string().min(8),
    age: z.coerce.number().int().min(0),
    course: z.coerce.number().int().min(0),
  })
  .strict();

// Update combinado (User + perfil). El service/command decide qué va a cada agregado.
export const updateStudentCommandSchema = z
  .object({
    // Campos de User (opcionalmente actualizables)
    name: z.string().transform((s) => s.trim()).pipe(z.string().min(2)).optional(),
    email: z.email().transform((s) => s.trim().toLowerCase()).optional(),
    role: z.enum(Roles).optional(),       // <-- corregido: .optional()
    password: z.string().min(8).optional(), // password en claro; el service hará hash

    // Campos del perfil Student
    age: z.coerce.number().int().min(0).optional(),
    course: z.coerce.number().int().min(0).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Debe enviar al menos un campo para actualizar.",
  });

/* ========= Persistence DTOs (hacia repos desde el servicio de Student) ========= */
// ¡OJO! Estos DTOs son SOLO del PERFIL Student (no repiten datos de User).
export const studentCreateSchema = z
  .object({
    userId: z.uuid(),
    age: z.coerce.number().int().min(0),
    course: z.coerce.number().int().min(0),
  })
  .strict();

export const studentUpdateSchema = z
  .object({
    age: z.coerce.number().int().min(0).optional(),
    course: z.coerce.number().int().min(0).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Debe enviar al menos un campo para actualizar.",
  });

/* ========= Read ========= */
// La implementación del repo hace include: [User] y el mapper rellena name/email desde User.
export const studentReadSchema = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(Roles),
    age: z.number().int().min(0),
    course: z.number().int().min(0),
  })
  .strict();

export const listStudentsQuerySchema = z
  .object({
    role: z.enum(Roles).optional(),
    active: z.coerce.boolean().optional(),
    email: z.string().email().optional(),
    userId: z.string().uuid().optional(),
    filter: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1))
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export const listStudentsResponseSchema = z
  .object({
    data: z.array(studentReadSchema),
    meta: z
      .object({
        limit: z.number().int().min(1),
        offset: z.number().int().min(0),
        total: z.number().int().min(0),
      })
      .strict(),
  })
  .strict();

export type StudentIdParams = z.infer<typeof studentIdParamsSchema>;

export type CreateStudent = z.infer<typeof createStudentCommandSchema>;
export type UpdateStudentPayload = z.infer<typeof updateStudentCommandSchema>;

export type StudentCreate = z.infer<typeof studentCreateSchema>;
export type StudentUpdate = z.infer<typeof studentUpdateSchema>;

export type StudentRead = z.infer<typeof studentReadSchema>;
export type ListStudents = z.infer<typeof listStudentsQuerySchema>;
export type ListStudentsResponse = z.infer<typeof listStudentsResponseSchema>;
