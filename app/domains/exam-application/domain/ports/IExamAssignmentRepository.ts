import { AssignedExamStatus } from '../../entities/enums/AssignedExamStatus';
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
    examTitle?: string;
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

export type ExamAssignmentStatusSnapshot = {
    id: string;
    examId: string;
    studentId: string;
    status: AssignedExamStatus;
    applicationDate: Date | null;
    durationMinutes: number | null;
    grade: number | null;
};

export interface IExamAssignmentRepository {
    createExamAssignment(input: CreateExamAssignmentInput): Promise<void>;
    listStudentExamAssignments(
        criteria: ListExamAssignmentsCriteria,
    ): Promise<Page<StudentExamAssignmentItem>>;

    findByExamIdAndStudentId(
        examId: string,
        studentId: string,
    ): Promise<StudentExamAssignmentItem | null>;

    updateStatus(id: string, status: AssignedExamStatus): Promise<void>;
    updateGrade(id: string, params: { grade: number; status?: AssignedExamStatus }): Promise<void>;
    findDetailedById(id: string): Promise<StudentExamAssignmentItem | null>;
    listAssignmentsForStatusRefresh(studentId: string): Promise<ExamAssignmentStatusSnapshot[]>;
}
