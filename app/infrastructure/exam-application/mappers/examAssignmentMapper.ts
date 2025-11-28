import { CreateExamAssignmentInput } from '../../../domains/exam-application/domain/ports/IExamAssignmentRepository';

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
};
