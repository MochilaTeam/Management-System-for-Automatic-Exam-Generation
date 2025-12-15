import { Includeable, ModelStatic, Op, WhereOptions } from 'sequelize';

import type {
    CreateExamRegradeInput,
    IExamRegradeRepository,
    ListPendingRegradesCriteria,
    Page,
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

    async findById(id: string): Promise<ExamRegradeOutput | null> {
        try {
            const row = await this.model.findByPk(id);
            return row ? ExamRegradeMapper.toOutput(row) : null;
        } catch {
            throw new BaseDatabaseError({
                message: 'Error buscando la solicitud de recalificación',
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

    async findAnyActiveByExamAndProfessor(
        examId: string,
        professorId: string,
    ): Promise<ExamRegradeOutput | null> {
        try {
            const row = await this.model.findOne({
                where: {
                    examId,
                    professorId,
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

    async listPendingByProfessor({
        professorId,
        limit,
        offset,
        statuses,
        subjectId,
        examTitle,
        studentId,
    }: ListPendingRegradesCriteria): Promise<Page<ExamRegradeOutput>> {
        try {
            const statusFilter =
                statuses && statuses.length > 0
                    ? statuses
                    : [ExamRegradesStatus.REQUESTED, ExamRegradesStatus.IN_REVIEW];

            const where: WhereOptions = {
                professorId,
                status: {
                    [Op.in]: statusFilter,
                },
            };

            if (studentId) {
                where.studentId = studentId;
            }

            const examWhere: WhereOptions = {};
            if (subjectId) {
                examWhere.subjectId = subjectId;
            }
            if (examTitle) {
                examWhere.title = { [Op.like]: `%${examTitle}%` };
            }

            const include: Includeable[] = [];
            if (Object.keys(examWhere).length > 0) {
                include.push({
                    association: 'exam',
                    where: examWhere,
                });
            }

            const { rows, count } = await this.model.findAndCountAll({
                where,
                include,
                limit,
                offset,
                order: [['requestedAt', 'DESC']],
            });

            return {
                items: rows.map((row) => ExamRegradeMapper.toOutput(row)),
                total: count,
            };
        } catch {
            throw new BaseDatabaseError({
                message: 'Error obteniendo solicitudes de recalificación',
            });
        }
    }

    async resolve(
        id: string,
        params: { status: ExamRegradesStatus; resolvedAt: Date; finalGrade: number },
    ): Promise<void> {
        const regrade = await this.model.findByPk(id);
        if (!regrade) {
            throw new BaseDatabaseError({ message: 'Solicitud de recalificación no encontrada' });
        }

        try {
            await regrade.update({
                status: params.status,
                resolvedAt: params.resolvedAt,
                finalGrade: params.finalGrade,
            });
        } catch {
            throw new BaseDatabaseError({
                message: 'Error resolviendo la solicitud de recalificación',
            });
        }
    }
}
