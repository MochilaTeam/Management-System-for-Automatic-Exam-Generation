import { ModelStatic, Transaction } from 'sequelize';

import { IExamRepository, ListExamsCriteria } from '../../../domains/exam-application/domain/ports/IExamRepository';
import {
    ExamCreate,
    ExamRead,
    ExamUpdate,
} from '../../../domains/exam-application/schemas/examSchema';
import { BaseRepository } from '../../../shared/domain/base_repository';
import { ExamMapper } from '../mappers/ExamMapper';
import type Exam from '../models/Exam';

export class ExamRepository
    extends BaseRepository<Exam, ExamRead, ExamCreate, ExamUpdate>
    implements IExamRepository
{
    constructor(model: ModelStatic<Exam>, defaultTx?: Transaction) {
        super(model, ExamMapper.toRead, ExamMapper.toCreateAttrs, ExamMapper.toUpdateAttrs, defaultTx);
    }

    static withTx(model: ModelStatic<Exam>, tx: Transaction) {
        return new ExamRepository(model, tx);
    }

    async paginate(criteria: ListExamsCriteria, tx?: Transaction) {
        const opts = ExamMapper.toOptions(criteria);
        return this.paginateByOptions(
            {
                where: opts.where,
                order: opts.order,
                limit: opts.limit,
                offset: opts.offset,
            },
            tx,
        );
    }

    async list(criteria: ListExamsCriteria, tx?: Transaction): Promise<ExamRead[]> {
        const opts = ExamMapper.toOptions(criteria);
        return this.listByOptions(
            {
                where: opts.where,
                order: opts.order,
                limit: opts.limit,
                offset: opts.offset,
            },
            tx,
        );
    }
}
