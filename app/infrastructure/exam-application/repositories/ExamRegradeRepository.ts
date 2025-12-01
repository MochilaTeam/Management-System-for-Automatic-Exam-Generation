import { ModelStatic, Op } from 'sequelize';

import type {
    CreateExamRegradeInput,
    IExamRegradeRepository,
} from '../../../domains/exam-application/domain/ports/IExamRegradeRepository';
import { ExamRegradesStatus } from '../../../domains/exam-application/entities/enums/ExamRegradeStatus';
import { ExamRegradeOutput } from '../../../domains/exam-application/schemas/examRegradeSchema';
import { BaseDatabaseError } from '../../../shared/exceptions/domainErrors';
import { ExamRegradeMapper } from '../mappers/examRegradeMapper';
import ExamRegrades from '../models/ExamRegrade';

export class ExamRegradeRepository implements IExamRegradeRepository {
    constructor(private readonly model: ModelStatic<ExamRegrades>) {}

    async create(input: CreateExamRegradeInput): Promise<ExamRegradeOutput> {
        try {
            const created = await this.model.create({
                examId: input.examId,
                studentId: input.studentId,
                professorId: input.professorId,
                reason: input.reason,
                status: input.status,
                requestedAt: input.requestedAt,
            });
            return ExamRegradeMapper.toOutput(created);
        } catch {
            throw new BaseDatabaseError({
                message: 'Error creando la solicitud de recalificación',
            });
        }
    }

    async findActiveByExamAndStudent(
        examId: string,
        studentId: string,
    ): Promise<ExamRegradeOutput | null> {
        try {
            const row = await this.model.findOne({
                where: {
                    examId,
                    studentId,
                    status: {
                        [Op.in]: [ExamRegradesStatus.REQUESTED, ExamRegradesStatus.IN_REVIEW],
                    },
                },
            });
            return row ? ExamRegradeMapper.toOutput(row) : null;
        } catch {
            throw new BaseDatabaseError({
                message: 'Error buscando solicitudes de recalificación activas',
            });
        }
    }
}
