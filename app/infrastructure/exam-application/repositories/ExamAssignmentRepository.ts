import { ModelStatic, Transaction } from 'sequelize';

import {
    IExamAssignmentRepository,
    CreateExamAssignmentInput,
} from '../../../domains/exam-application/domain/ports/IExamAssignmentRepository';
import { ExamAssignmentMapper } from '../mappers/examAssignmentMapper';
import ExamAssignments from '../models/ExamAssignment';
import { BaseDatabaseError } from '../../../shared/exceptions/domainErrors';

export class ExamAssignmentRepository implements IExamAssignmentRepository {
    constructor(
        private readonly model: ModelStatic<ExamAssignments>,
        private readonly defaultTx?: Transaction,
    ) { }

    static withTx(model: ModelStatic<ExamAssignments>, tx: Transaction) {
        return new ExamAssignmentRepository(model, tx);
    }

    async createExamAssignment(input: CreateExamAssignmentInput, tx?: Transaction): Promise<void> {
        try {
            const attrs = ExamAssignmentMapper.toCreateAttrs(input);
            await this.model.create(attrs as ExamAssignments['_creationAttributes'], {
                transaction: this.effTx(tx),
            });
        } catch (e) {
            throw new BaseDatabaseError({ message: "Error creando la asignacion del examen" });
        }
    }

    private effTx(tx?: Transaction): Transaction | undefined {
        return tx ?? this.defaultTx;
    }
}
