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
    subjectId?: string;
    examTitle?: string;
    studentId?: string;
};

export interface IExamRegradeRepository {
    create(input: CreateExamRegradeInput): Promise<ExamRegradeOutput>;
    findById(id: string): Promise<ExamRegradeOutput | null>;
    findActiveByExamAndStudent(
        examId: string,
        studentId: string,
    ): Promise<ExamRegradeOutput | null>;
    findAnyActiveByExamAndProfessor(
        examId: string,
        professorId: string,
    ): Promise<ExamRegradeOutput | null>;
    listPendingByProfessor(criteria: ListPendingRegradesCriteria): Promise<Page<ExamRegradeOutput>>;
    resolve(
        id: string,
        params: { status: ExamRegradesStatus; resolvedAt: Date; finalGrade: number },
    ): Promise<void>;
}
