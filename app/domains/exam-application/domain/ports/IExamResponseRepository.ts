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

export interface IExamResponseRepository {
    create(data: CreateExamResponseInput): Promise<ExamResponseOutput>;
}
