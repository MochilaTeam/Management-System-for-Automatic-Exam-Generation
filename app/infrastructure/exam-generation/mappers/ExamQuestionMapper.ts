import {
    ExamQuestionInput,
    ExamQuestionRead,
    examQuestionReadSchema,
} from '../../../domains/exam-generation/schemas/examSchema';
import type ExamQuestion from '../models/ExamQuestion';

export const ExamQuestionMapper = {
    toRead(row: ExamQuestion): ExamQuestionRead {
        const { id, examId, questionId, questionIndex } = row.get({ plain: true }) as {
            id: string;
            examId: string;
            questionId: string;
            questionIndex: number;
        };
        return examQuestionReadSchema.parse({ id, examId, questionId, questionIndex });
    },

    toBulkCreateAttrs(
        examId: string,
        questions: ExamQuestionInput[],
    ): Array<Record<string, unknown>> {
        return questions.map((q) => ({
            examId,
            questionId: q.questionId,
            questionIndex: q.questionIndex,
        }));
    },
};
