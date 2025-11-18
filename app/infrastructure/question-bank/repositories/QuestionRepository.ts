import { ModelStatic, Op, Transaction, WhereOptions } from 'sequelize';

import {
    IQuestionRepository,
    ListQuestionsCriteria,
    Page,
} from '../../../domains/question-bank/domain/ports/IQuestionRepository';
import {
    QuestionCreate,
    QuestionDetail,
    QuestionUpdate,
    questionCreateSchema,
    questionDetailSchema,
    questionUpdateSchema,
} from '../../../domains/question-bank/schemas/questionSchema';
import { BaseRepository } from '../../../shared/domain/base_repository';
import QuestionModel from '../models/Question';

type QuestionPlain = {
    id: string;
    authorId: string;
    questionTypeId: string;
    subTopicId: string;
    difficulty: string;
    body: string;
    options: Array<{ text: string; isCorrect: boolean }> | null;
    response: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export class QuestionRepository
    extends BaseRepository<QuestionModel, QuestionDetail, QuestionCreate, QuestionUpdate>
    implements IQuestionRepository
{
    constructor(model: ModelStatic<QuestionModel>, defaultTx?: Transaction) {
        super(
            model,
            (row) => {
                const p = row.get({ plain: true }) as QuestionPlain;
                return questionDetailSchema.parse({
                    questionId: p.id,
                    authorId: p.authorId,
                    questionTypeId: p.questionTypeId,
                    subtopicId: p.subTopicId,
                    difficulty: p.difficulty,
                    body: p.body,
                    options: p.options ?? null,
                    response: p.response ?? null,
                    active: Boolean(p.active),
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                });
            },
            (dto: QuestionCreate) => {
                const safe = questionCreateSchema.parse(dto);
                return {
                    authorId: safe.authorId,
                    questionTypeId: safe.questionTypeId,
                    subTopicId: safe.subTopicId,
                    difficulty: safe.difficulty,
                    body: safe.body,
                    options: safe.options ?? null,
                    response: safe.response ?? null,
                };
            },
            (dto: QuestionUpdate) => {
                const safe = questionUpdateSchema.parse(dto);
                const out: Record<string, unknown> = {};
                if (safe.questionTypeId !== undefined) out.questionTypeId = safe.questionTypeId;
                if (safe.subTopicId !== undefined) out.subTopicId = safe.subTopicId;
                if (safe.difficulty !== undefined) out.difficulty = safe.difficulty;
                if (safe.body !== undefined) out.body = safe.body;
                if (safe.options !== undefined) out.options = safe.options;
                if (safe.response !== undefined) out.response = safe.response;
                if (safe.active !== undefined) out.active = safe.active;
                return out;
            },
            defaultTx,
        );
    }

    static withTx(model: ModelStatic<QuestionModel>, tx: Transaction) {
        return new QuestionRepository(model, tx);
    }

    async paginateDetail(
        criteria: ListQuestionsCriteria,
        tx?: Transaction,
    ): Promise<Page<QuestionDetail>> {
        try {
            const where: WhereOptions = { active: true };

            if (criteria.filters?.q) {
                where['body'] = { [Op.like]: `%${criteria.filters.q}%` };
            }
            if (criteria.filters?.subtopicId) {
                where['subTopicId'] = criteria.filters.subtopicId;
            }
            if (criteria.filters?.authorId) {
                where['authorId'] = criteria.filters.authorId;
            }
            if (criteria.filters?.difficulty) {
                where['difficulty'] = criteria.filters.difficulty;
            }
            if (criteria.filters?.questionTypeId) {
                where['questionTypeId'] = criteria.filters.questionTypeId;
            }

            const limit = criteria.limit ?? 20;
            const offset = criteria.offset ?? 0;

            const { rows, count } = await this.model.findAndCountAll({
                where,
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                transaction: this.effTx(tx),
            });

            const items = rows.map((r) => this.toReadFn(r));
            return { items, total: count };
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async get_detail_by_id(id: string, tx?: Transaction): Promise<QuestionDetail | null> {
        try {
            const row = await this.model.findOne({
                where: { id, active: true },
                transaction: this.effTx(tx),
            });
            return row ? this.toReadFn(row) : null;
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async create(data: QuestionCreate, tx?: Transaction): Promise<QuestionDetail> {
        return super.create(data, tx);
    }

    async update(
        id: string,
        patch: QuestionUpdate,
        tx?: Transaction,
    ): Promise<QuestionDetail | null> {
        try {
            const row = await this.model.findByPk(id, { transaction: this.effTx(tx) });
            if (!row) return null;
            const attrs = this.toUpdateAttrsFn(patch);
            if (Object.keys(attrs).length === 0) {
                return this.toReadFn(row);
            }
            await row.update(attrs, { transaction: this.effTx(tx) });
            return this.toReadFn(row);
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async deleteHardById(id: string, tx?: Transaction): Promise<boolean> {
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

    async softDeleteById(id: string, tx?: Transaction): Promise<boolean> {
        try {
            const [updated] = await this.model.update(
                { active: false },
                { where: { id }, transaction: this.effTx(tx) },
            );
            return updated > 0;
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async existsByStatementAndSubtopic(
        statement: string,
        subtopicId: string,
        tx?: Transaction,
    ): Promise<boolean> {
        try {
            const count = await this.model.count({
                where: {
                    body: statement,
                    subTopicId: subtopicId,
                    active: true,
                },
                transaction: this.effTx(tx),
            });
            return count > 0;
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async existsByStatementAndSubtopicExceptId(
        statement: string,
        subtopicId: string,
        excludeId: string,
        tx?: Transaction,
    ): Promise<boolean> {
        try {
            const count = await this.model.count({
                where: {
                    body: statement,
                    subTopicId: subtopicId,
                    active: true,
                    id: { [Op.ne]: excludeId },
                },
                transaction: this.effTx(tx),
            });
            return count > 0;
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }
}
