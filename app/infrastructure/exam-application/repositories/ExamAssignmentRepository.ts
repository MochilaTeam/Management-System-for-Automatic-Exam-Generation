import { ModelStatic, Transaction, WhereOptions, Includeable, Op } from 'sequelize';

import type {
    IExamAssignmentRepository,
    CreateExamAssignmentInput,
    ListExamAssignmentsCriteria,
    Page,
    ExamAssignmentStatusSnapshot,
} from '../../../domains/exam-application/domain/ports/IExamAssignmentRepository';
import { AssignedExamStatus } from '../../../domains/exam-application/entities/enums/AssignedExamStatus';
import { StudentExamAssignmentItem } from '../../../domains/exam-application/schemas/examAssignmentSchema';
import { BaseDatabaseError } from '../../../shared/exceptions/domainErrors';
import { ExamAssignmentMapper } from '../mappers/examAssignmentMapper';
import ExamAssignments from '../models/ExamAssignment';

export class ExamAssignmentRepository implements IExamAssignmentRepository {
    constructor(
        private readonly model: ModelStatic<ExamAssignments>,
        private readonly defaultTx?: Transaction,
    ) {}

    static withTx(model: ModelStatic<ExamAssignments>, tx: Transaction) {
        return new ExamAssignmentRepository(model, tx);
    }

    async createExamAssignment(input: CreateExamAssignmentInput, tx?: Transaction): Promise<void> {
        try {
            const attrs = ExamAssignmentMapper.toCreateAttrs(input);
            await this.model.create(attrs as ExamAssignments['_creationAttributes'], {
                transaction: this.effTx(tx),
            });
        } catch {
            throw new BaseDatabaseError({ message: 'Error creando la asignacion del examen' });
        }
    }

    async listStudentExamAssignments(
        criteria: ListExamAssignmentsCriteria,
        tx?: Transaction,
    ): Promise<Page<StudentExamAssignmentItem>> {
        try {
            const where: WhereOptions = {};
            const examWhere: WhereOptions = {};

            // Apply filters
            if (criteria.filters?.studentId) {
                where.studentId = criteria.filters.studentId;
            }
            if (criteria.filters?.status) {
                where.status = criteria.filters.status;
            }
            if (criteria.filters?.teacherId) {
                where.professorId = criteria.filters.teacherId;
            }
            if (criteria.filters?.subjectId) {
                examWhere.subjectId = criteria.filters.subjectId;
            }
            if (criteria.filters?.examTitle) {
                examWhere.title = { [Op.like]: `%${criteria.filters.examTitle}%` };
            }

            const limit = criteria.limit ?? 10;
            const offset = criteria.offset ?? 0;

            const includes = await this.buildDetailIncludes(examWhere);

            const { rows, count } = await this.model.findAndCountAll({
                where,
                include: includes,
                limit,
                offset,
                order: [['applicationDate', 'DESC']], //order by recent
                transaction: this.effTx(tx),
            });

            const items = rows.map((row) => ExamAssignmentMapper.toStudentExamItem(row));
            return { items, total: count };
        } catch {
            throw new BaseDatabaseError({
                message: 'Error obteniendo las asignaciones de exámenes',
            });
        }
    }

    async findByExamIdAndStudentId(
        examId: string,
        studentId: string,
        tx?: Transaction,
    ): Promise<StudentExamAssignmentItem | null> {
        try {
            const includes = await this.buildDetailIncludes();
            const assignment = await this.model.findOne({
                where: { examId, studentId },
                include: includes,
                transaction: this.effTx(tx),
            });

            if (!assignment) return null;

            return ExamAssignmentMapper.toStudentExamItem(assignment);
        } catch {
            throw new BaseDatabaseError({
                message: 'Error buscando la asignación del examen',
            });
        }
    }

    async updateStatus(id: string, status: AssignedExamStatus, tx?: Transaction): Promise<void> {
        const assignment = await this.model.findByPk(id, {
            transaction: this.effTx(tx),
        });
        if (!assignment) {
            throw new BaseDatabaseError({ message: 'Asignación no encontrada' });
        }

        try {
            await assignment.update({ status }, { transaction: this.effTx(tx) });
        } catch {
            throw new BaseDatabaseError({
                message: 'Error actualizando el estado de la asignación',
            });
        }
    }

    async updateGrade(
        id: string,
        params: { grade: number; status?: AssignedExamStatus },
        tx?: Transaction,
    ): Promise<void> {
        const assignment = await this.model.findByPk(id, {
            transaction: this.effTx(tx),
        });
        if (!assignment) {
            throw new BaseDatabaseError({ message: 'Asignación no encontrada' });
        }

        try {
            await assignment.update(
                {
                    grade: params.grade,
                    ...(params.status ? { status: params.status } : {}),
                },
                { transaction: this.effTx(tx) },
            );
        } catch {
            throw new BaseDatabaseError({
                message: 'Error actualizando la calificación de la asignación',
            });
        }
    }

    async findDetailedById(
        id: string,
        tx?: Transaction,
    ): Promise<StudentExamAssignmentItem | null> {
        try {
            const includes = await this.buildDetailIncludes();
            const assignment = await this.model.findByPk(id, {
                include: includes,
                transaction: this.effTx(tx),
            });

            if (!assignment) return null;

            return ExamAssignmentMapper.toStudentExamItem(assignment);
        } catch {
            throw new BaseDatabaseError({
                message: 'Error obteniendo la asignación del examen',
            });
        }
    }

    async listAssignmentsForStatusRefresh(
        studentId: string,
        tx?: Transaction,
    ): Promise<ExamAssignmentStatusSnapshot[]> {
        try {
            const rows = await this.model.findAll({
                where: { studentId },
                transaction: this.effTx(tx),
            });

            return rows.map((row) => ({
                id: row.id,
                examId: row.examId,
                studentId: row.studentId,
                status: row.status,
                applicationDate: row.applicationDate,
                durationMinutes: row.durationMinutes,
                grade: row.grade !== null ? Number(row.grade) : null,
            }));
        } catch {
            throw new BaseDatabaseError({
                message: 'Error obteniendo las asignaciones del estudiante',
            });
        }
    }

    private effTx(tx?: Transaction): Transaction | undefined {
        return tx ?? this.defaultTx;
    }

    private async buildDetailIncludes(examWhere?: WhereOptions): Promise<Includeable[]> {
        //Avoid circular dependencies
        const Exam = (await import('../../exam-generation/models/Exam')).default;
        const Teacher = (await import('../../user/models/Teacher')).default;
        const User = (await import('../../user/models/User')).default;
        const Subject = (await import('../../question-bank/models/Subject')).default;

        return [
            {
                model: Exam,
                as: 'exam',
                required: true,
                where: examWhere && Object.keys(examWhere).length > 0 ? examWhere : undefined,
                include: [
                    {
                        model: Subject,
                        as: 'subject',
                        required: true,
                    },
                ],
            },
            {
                model: Teacher,
                as: 'professor',
                required: true,
                include: [
                    {
                        model: User,
                        as: 'user',
                        required: true,
                    },
                ],
            },
        ];
    }
}
