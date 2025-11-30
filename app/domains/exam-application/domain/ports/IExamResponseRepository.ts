import { ExamResponseOutput } from '../../schemas/examResponseSchema';

export type CreateExamResponseInput = {
    examId: string;
    examQuestionId: string;
    studentId: string;
    selectedOptions: { text: string; isCorrect: boolean }[] | null;
    textAnswer: string | null;
    autoPoints: number | null;
    manualPoints: number | null;
    answeredAt: Date;
};

export type UpdateExamResponseInput = {
    responseId: string;
    selectedOptions: { text: string; isCorrect: boolean }[] | null;
    textAnswer: string | null;
    autoPoints: number | null;
    answeredAt: Date;
};

export interface IExamResponseRepository {
    create(data: CreateExamResponseInput): Promise<ExamResponseOutput>;
    findById(responseId: string): Promise<ExamResponseOutput | null>;
    findByExamQuestionAndStudent(
        examQuestionId: string,
        studentId: string,
    ): Promise<ExamResponseOutput | null>;
    update(data: UpdateExamResponseInput): Promise<ExamResponseOutput>;
    studentHasResponses(examId: string, studentId: string): Promise<boolean>;
}
