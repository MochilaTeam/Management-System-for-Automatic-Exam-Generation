import { z } from 'zod';

import { Roles } from '../../../shared/enums/rolesEnum';

export const booleanFromQuery = z.preprocess((value) => {
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') return true;
        if (normalized === 'false' || normalized === '0') return false;
    }
    return value;
}, z.boolean());

const nameSchema = z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(2));
const emailSchema = z.email().transform((s) => s.trim().toLowerCase());
const specialtySchema = z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(2));
const teacherRoles = [Roles.TEACHER, Roles.SUBJECT_LEADER, Roles.EXAMINER] as const;
const teacherRoleEnum = z.enum(teacherRoles);

//Params
export const teacherIdParamsSchema = z
    .object({
        teacherId: z.uuid(),
    })
    .strict();

//Commands (entrada HTTP)
export const createTeacherCommandSchema = z
    .object({
        name: nameSchema,
        email: emailSchema,
        role: teacherRoleEnum,
        password: z.string().min(8),
        specialty: specialtySchema,
        hasRoleSubjectLeader: z.boolean().optional(),
        hasRoleExaminer: z.boolean().optional(),
    })
    .strict();

export const updateTeacherCommandSchema = z
    .object({
        name: nameSchema.optional(),
        email: emailSchema.optional(),
        role: teacherRoleEnum.optional(),
        password: z.string().min(8).optional(),
        specialty: specialtySchema.optional(),
        hasRoleSubjectLeader: z.boolean().optional(),
        hasRoleExaminer: z.boolean().optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'Debe enviar al menos un campo para actualizar.',
    });

//Persistence DTOs (perfil Teacher)
export const teacherCreateSchema = z
    .object({
        userId: z.uuid(),
        specialty: specialtySchema,
        hasRoleSubjectLeader: z.boolean(),
        hasRoleExaminer: z.boolean(),
    })
    .strict();

export const teacherUpdateSchema = z
    .object({
        specialty: specialtySchema.optional(),
        hasRoleSubjectLeader: z.boolean().optional(),
        hasRoleExaminer: z.boolean().optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).length > 0, {
        message: 'Debe enviar al menos un campo para actualizar.',
    });

//Read
export const teacherReadSchema = z
    .object({
        id: z.uuid(),
        userId: z.uuid(),
        name: z.string(),
        email: z.email(),
        role: z.enum(Roles),
        specialty: z.string(),
        hasRoleSubjectLeader: z.boolean(),
        hasRoleExaminer: z.boolean(),
    })
    .strict();

//Queries
export const listTeachersQuerySchema = z
    .object({
        role: z.enum(Roles).optional(),
        active: booleanFromQuery.optional(),
        email: z.email().optional(),
        userId: z.string().uuid().optional(),
        filter: z
            .string()
            .transform((s) => s.trim())
            .pipe(z.string().min(1))
            .optional(),
        subjectLeader: booleanFromQuery.optional(),
        examiner: booleanFromQuery.optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        offset: z.coerce.number().int().min(0).default(0),
    })
    .strict();

export type TeacherIdParams = z.infer<typeof teacherIdParamsSchema>;

export type CreateTeacherCommand = z.infer<typeof createTeacherCommandSchema>;
export type UpdateTeacherCommand = z.infer<typeof updateTeacherCommandSchema>;

export type TeacherCreate = z.infer<typeof teacherCreateSchema>;
export type TeacherUpdate = z.infer<typeof teacherUpdateSchema>;

export type TeacherRead = z.infer<typeof teacherReadSchema>;
export type ListTeachers = z.infer<typeof listTeachersQuerySchema>;
