import { CreateExamAssignmentInput } from '../../../domains/exam-application/domain/ports/IExamAssignmentRepository';
import { AssignedExamStatus } from '../../../domains/exam-application/entities/enums/AssignedExamStatus';
import { StudentExamAssignmentItem } from '../../../domains/exam-application/schemas/examAssignmentSchema';
import ExamAssignments from '../models/ExamAssignment';

// Type for the plain object returned by Sequelize with includes
type ExamAssignmentWithIncludes = {
    id: string;
    examId: string;
    professorId: string;
    status: AssignedExamStatus;
    applicationDate: Date;
    durationMinutes: number;
    grade: string | number | null;
    exam?: {
        subjectId: string;
        subject?: {
            name: string;
        };
    };
    professor?: {
        user?: {
            name: string;
        };
    };
};

export const ExamAssignmentMapper = {
    toCreateAttrs(dto: CreateExamAssignmentInput) {
        return {
            examId: dto.examId,
            studentId: dto.studentId,
            professorId: dto.professorId,
            applicationDate: dto.applicationDate,
            durationMinutes: dto.durationMinutes,
        };
    },

    toStudentExamItem(row: ExamAssignments): StudentExamAssignmentItem {
        const plain = row.get({ plain: true }) as ExamAssignmentWithIncludes;

        return {
            id: plain.id,
            examId: plain.examId,
            subjectId: plain.exam?.subjectId ?? '',
            subjectName: plain.exam?.subject?.name ?? 'Asigatura desconocida',
            teacherId: plain.professorId,
        teacherName: plain.professor?.user?.name ?? 'Profesor desconocido',
        status: plain.status,
        applicationDate: plain.applicationDate,
        durationMinutes: plain.durationMinutes,
        grade: plain.grade !== null && plain.grade !== undefined ? Number(plain.grade) : null,
    };
    },
};
