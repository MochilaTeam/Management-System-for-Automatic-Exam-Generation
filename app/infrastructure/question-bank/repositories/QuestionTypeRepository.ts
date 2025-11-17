// src/infrastructure/question-bank/repositories/QuestionTypeRepository.ts
import { ModelStatic, Transaction } from 'sequelize';

import {
    IQuestionTypeRepository,
    ListQuestionTypesCriteria,
} from '../../../domains/question-bank/domain/ports/IQuestionTypeRepository';
import {
    QuestionTypeCreate,
    QuestionTypeRead,
    QuestionTypeUpdate,
} from '../../../domains/question-bank/schemas/questionTypeSchema';
import { BaseRepository } from '../../../shared/domain/base_repository';
import { QuestionTypeMapper } from '../mappers/questionTypeMapper';
import type QuestionType from '../models/QuestionType';

export class QuestionTypeRepository
    extends BaseRepository<QuestionType, QuestionTypeRead, QuestionTypeCreate, QuestionTypeUpdate>
    implements IQuestionTypeRepository
{
    constructor(model: ModelStatic<QuestionType>, defaultTx?: Transaction) {
        super(
            model,
            QuestionTypeMapper.toRead.bind(QuestionTypeMapper),
            QuestionTypeMapper.toCreateAttrs.bind(QuestionTypeMapper),
            QuestionTypeMapper.toUpdateAttrs.bind(QuestionTypeMapper),
            defaultTx,
        );
    }

    static withTx(model: ModelStatic<QuestionType>, tx: Transaction) {
        return new QuestionTypeRepository(model, tx);
    }

    async paginate(criteria: ListQuestionTypesCriteria, tx?: Transaction) {
        const opts = QuestionTypeMapper.toOptions(criteria);
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

    async list(criteria: ListQuestionTypesCriteria, tx?: Transaction): Promise<QuestionTypeRead[]> {
        const opts = QuestionTypeMapper.toOptions(criteria);
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

    async existsByName(name: string, tx?: Transaction): Promise<boolean> {
        try {
            const count = await this.model.count({
                where: { name },
                transaction: this.effTx(tx),
            });
            return count > 0;
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async deleteById(id: string, tx?: Transaction): Promise<boolean> {
        try {
            const deleted = await this.model.destroy({
                where: { id },
                transaction: this.effTx(tx),
            });
            return deleted > 0;
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }
}
