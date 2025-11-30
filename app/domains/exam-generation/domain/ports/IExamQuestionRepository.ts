import { ExamQuestionInput, ExamQuestionRead } from '../../schemas/examSchema';

export interface IExamQuestionRepository {
    replaceExamQuestions(examId: string, questions: ExamQuestionInput[]): Promise<void>;
    listByExamId(examId: string): Promise<ExamQuestionRead[]>;
    getById(id: string): Promise<ExamQuestionRead | null>;
    findByExamIdAndIndex(
        examId: string,
        questionIndex: number,
    ): Promise<ExamQuestionRead | null>;
}
