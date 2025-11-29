import { ExamQuestionInput, ExamQuestionRead } from '../../schemas/examSchema';

export interface IExamQuestionRepository {
    replaceExamQuestions(examId: string, questions: ExamQuestionInput[]): Promise<void>;
    listByExamId(examId: string): Promise<ExamQuestionRead[]>;
}
