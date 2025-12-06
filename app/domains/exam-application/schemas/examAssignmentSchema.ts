import { z } from 'zod';

import { AssignedExamStatus } from '../entities/enums/AssignedExamStatus';
import { ExamStatusEnum } from '../entities/enums/ExamStatusEnum';

// ===== Params =====
export const examIdParamsSchema = z
    .object({
        examId: z.string().uuid(),
    })
    .strict();

export type ExamIdParams = z.infer<typeof examIdParamsSchema>;

// ===== Body for assigning exam to selected students =====
export const assignExamToCourseBodySchema = z
    .object({
        studentIds: z.array(z.string().uuid()).min(1),
        applicationDate: z
            .string()
            .datetime()
            .transform((str) => new Date(str)),
        durationMinutes: z.number().int().min(1).max(480), // Máximo 8 horas
    })
    .strict();

export type AssignExamToCourseBody = z.infer<typeof assignExamToCourseBodySchema>;

export const createExamAssignmentCommandSchema = assignExamToCourseBodySchema
    .extend({
        examId: z.string().uuid(),
        currentUserId: z.string().uuid(),
    })
    .strict();

export type CreateExamAssignmentCommandSchema = z.infer<typeof createExamAssignmentCommandSchema>;

export const sendExamToEvaluatorCommandSchema = z
    .object({
        examId: z.string().uuid(),
        currentUserId: z.string().uuid(),
    })
    .strict();

export type SendExamToEvaluatorCommandSchema = z.infer<typeof sendExamToEvaluatorCommandSchema>;

export const calculateExamGradeCommandSchema = z
    .object({
        assignmentId: z.string().uuid(),
        currentUserId: z.string().uuid(),
    })
    .strict();

export type CalculateExamGradeCommandSchema = z.infer<typeof calculateExamGradeCommandSchema>;

export const calculateExamGradeResultSchema = z
    .object({
        assignmentId: z.string().uuid(),
        examId: z.string().uuid(),
        studentId: z.string().uuid(),
        finalGrade: z.number(),
        examTotalScore: z.number(),
    })
    .strict();

export type CalculateExamGradeResult = z.infer<typeof calculateExamGradeResultSchema>;

// ===== Query for listing student exams =====
export const listStudentExamsQuerySchema = z
    .object({
        currentUserId: z.string().uuid(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
        status: z.nativeEnum(AssignedExamStatus).optional(),
        subjectId: z.string().uuid().optional(),
        teacherId: z.string().uuid().optional(),
        examTitle: z.string().optional(),
    })
    .strict();

export type ListStudentExamsQuery = z.infer<typeof listStudentExamsQuerySchema>;

export const listEvaluatorExamsQuerySchema = z
    .object({
        currentUserId: z.string().uuid(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
    })
    .strict();

export type ListEvaluatorExamsQuery = z.infer<typeof listEvaluatorExamsQuerySchema>;

// ===== Responses =====

export const assignExamToCourseResponseSchema = z
    .object({
        examId: z.string().uuid(),
        assignedStudentIds: z.array(z.string().uuid()),
        assignmentsCreated: z.number().int().min(0),
        applicationDate: z.date(),
        durationMinutes: z.number().int().min(1),
        examStatus: z.enum([ExamStatusEnum.PUBLISHED]),
    })
    .strict();

export type AssignExamToCourseResponse = z.infer<typeof assignExamToCourseResponseSchema>;

export const studentExamAssignmentItemSchema = z
    .object({
        id: z.string().uuid(),
        examId: z.string().uuid(),
        studentId: z.string().uuid(),
        subjectId: z.string().uuid(),
        subjectName: z.string(),
        teacherId: z.string().uuid(),
        teacherName: z.string(),
        status: z.nativeEnum(AssignedExamStatus),
        applicationDate: z.date(),
        durationMinutes: z.number().int().min(1),
        grade: z.number().nullable(),
    })
    .strict();

export type StudentExamAssignmentItem = z.infer<typeof studentExamAssignmentItemSchema>;
