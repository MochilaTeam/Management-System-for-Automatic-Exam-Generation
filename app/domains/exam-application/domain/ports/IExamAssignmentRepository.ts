export type CreateExamAssignmentInput = {
    examId: string;
    studentId: string;
    professorId: string;
    applicationDate: Date;
    durationMinutes: number;
};

export interface IExamAssignmentRepository {
    createExamAssignment(input: CreateExamAssignmentInput): Promise<void>;
}
