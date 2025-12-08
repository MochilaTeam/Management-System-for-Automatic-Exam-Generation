import { ExamRegradesStatus } from '../../entities/enums/ExamRegradeStatus';
import { ExamRegradeOutput } from '../../schemas/examRegradeSchema';

export type CreateExamRegradeInput = {
    examId: string;
    studentId: string;
    professorId: string;
    reason: string | null;
    status: ExamRegradesStatus;
    requestedAt: Date;
};

export type Page<T> = {
    items: T[];
    total: number;
};

export type ListPendingRegradesCriteria = {
    professorId: string;
    limit: number;
    offset: number;
    statuses?: ExamRegradesStatus[];
};

export interface IExamRegradeRepository {
    create(input: CreateExamRegradeInput): Promise<ExamRegradeOutput>;
    findActiveByExamAndStudent(
        examId: string,
        studentId: string,
    ): Promise<ExamRegradeOutput | null>;
    listPendingByProfessor(criteria: ListPendingRegradesCriteria): Promise<Page<ExamRegradeOutput>>;
}
