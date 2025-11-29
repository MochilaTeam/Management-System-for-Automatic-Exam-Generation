import { ModelStatic, Transaction, WhereOptions, Includeable } from 'sequelize';

import {
    IExamAssignmentRepository,
    CreateExamAssignmentInput,
    ListExamAssignmentsCriteria,
    Page,
} from '../../../domains/exam-application/domain/ports/IExamAssignmentRepository';
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
            //Avoid circular dependencies
            const Exam = (await import('../../exam-generation/models/Exam')).default;
            const Teacher = (await import('../../user/models/Teacher')).default;
            const User = (await import('../../user/models/User')).default;
            const Subject = (await import('../../question-bank/models/Subject')).default;

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

            const limit = criteria.limit ?? 10;
            const offset = criteria.offset ?? 0;

            // Build includes with proper associations
            const includes: Includeable[] = [
                {
                    model: Exam,
                    as: 'exam',
                    required: true,
                    where: Object.keys(examWhere).length > 0 ? examWhere : undefined,
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

    private effTx(tx?: Transaction): Transaction | undefined {
        return tx ?? this.defaultTx;
    }
}
