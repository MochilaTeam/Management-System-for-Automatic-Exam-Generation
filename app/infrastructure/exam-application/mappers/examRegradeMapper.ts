import { ExamRegradeOutput } from '../../../domains/exam-application/schemas/examRegradeSchema';
import ExamRegrades from '../models/ExamRegrade';

type ExamRegradePlain = {
    id: string;
    studentId: string;
    examId: string;
    professorId: string;
    reason: string | null;
    status: string;
    requestedAt: Date;
    resolvedAt: Date | null;
    finalGrade: string | number | null;
};

export const ExamRegradeMapper = {
    toOutput(row: ExamRegrades): ExamRegradeOutput {
        const plain = row.get({ plain: true }) as ExamRegradePlain;
        return {
            id: plain.id,
            studentId: plain.studentId,
            examId: plain.examId,
            professorId: plain.professorId,
            reason: plain.reason,
            status: plain.status as ExamRegradeOutput['status'],
            requestedAt: plain.requestedAt,
            resolvedAt: plain.resolvedAt,
            finalGrade: plain.finalGrade !== null ? Number(plain.finalGrade) : null,
        };
    },
};
