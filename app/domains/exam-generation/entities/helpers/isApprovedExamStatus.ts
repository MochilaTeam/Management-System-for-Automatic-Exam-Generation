import { ExamStatusEnum } from '../../../exam-application/entities/enums/ExamStatusEnum';

export function isApprovedExamStatus(status: ExamStatusEnum): boolean {
    return status === ExamStatusEnum.APPROVED || status === ExamStatusEnum.PUBLISHED;
}
