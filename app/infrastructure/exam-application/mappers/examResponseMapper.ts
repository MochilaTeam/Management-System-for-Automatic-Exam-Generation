import { CreateExamResponseInput } from '../../../domains/exam-application/domain/ports/IExamResponseRepository';
import { ExamResponseOutput } from '../../../domains/exam-application/schemas/examResponseSchema';
import ExamResponses from '../models/ExamResponse';

export const ExamResponseMapper = {
    toCreateAttrs(dto: CreateExamResponseInput) {
        return {
            examId: dto.examId,
            examQuestionId: dto.examQuestionId,
            studentId: dto.studentId,
            selectedOptions: dto.selectedOptions,
            textAnswer: dto.textAnswer,
            autoPoints: dto.autoPoints,
            manualPoints: dto.manualPoints,
            answeredAt: dto.answeredAt,
        };
    },

    toOutput(row: ExamResponses): ExamResponseOutput {
        return {
            id: row.id,
            examId: row.examId,
            examQuestionId: row.examQuestionId,
            studentId: row.studentId,
            selectedOptions: row.selectedOptions,
            textAnswer: row.textAnswer,
            autoPoints: row.autoPoints,
            manualPoints: row.manualPoints,
            answeredAt: row.answeredAt!,
        };
    },
};
