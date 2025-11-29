import { AssignedExamStatus } from '../../../../infrastructure/exam-application/enums/AssignedExamStatus';
import { StudentExamAssignmentItem } from '../../schemas/examAssignmentSchema';

export type CreateExamAssignmentInput = {
    examId: string;
    studentId: string;
    professorId: string;
    applicationDate: Date;
    durationMinutes: number;
};

export type ExamAssignmentFilters = {
    studentId?: string;
    status?: AssignedExamStatus;
    subjectId?: string;
    teacherId?: string;
};

export type ListExamAssignmentsCriteria = {
    offset?: number;
    limit?: number;
    filters?: ExamAssignmentFilters;
};

export type Page<T> = {
    items: T[];
    total: number;
};

export interface IExamAssignmentRepository {
    createExamAssignment(input: CreateExamAssignmentInput): Promise<void>;
    listStudentExamAssignments(
        criteria: ListExamAssignmentsCriteria,
    ): Promise<Page<StudentExamAssignmentItem>>;
}
