import { Includeable, ModelStatic, Op, Transaction, WhereOptions } from 'sequelize';

import { sequelize } from '../../../database/database';
import type {
    IQuestionRepository as IExamQuestionRepository,
    QuestionForExam,
    QuestionSearchCriteria,
} from '../../../domains/exam-generation/domain/ports/IQuestionRepository';
import type {
    IQuestionRepository as IQuestionBankRepository,
    ListQuestionsCriteria,
    Page,
} from '../../../domains/question-bank/domain/ports/IQuestionRepository';
import { DifficultyLevelEnum } from '../../../domains/question-bank/entities/enums/DifficultyLevels';
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
import SubjectTopic from '../models/SubjectTopic';
import Subtopic from '../models/SubTopic';

type QuestionPlain = {
    id: string;
    authorId: string;
    questionTypeId: string;
    subTopicId: string;
    difficulty: DifficultyLevelEnum;
    body: string;
    options: Array<{ text: string; isCorrect: boolean }> | null;
    response: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
};

const toQuestionDetail = (row: QuestionModel): QuestionDetail => {
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
};

const toCreateAttrs = (dto: QuestionCreate): Record<string, unknown> => {
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
};

const toUpdateAttrs = (dto: QuestionUpdate): Record<string, unknown> => {
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
};

export class QuestionRepository
    extends BaseRepository<QuestionModel, QuestionDetail, QuestionCreate, QuestionUpdate>
    implements IQuestionBankRepository, IExamQuestionRepository
{
    constructor(model: ModelStatic<QuestionModel>, defaultTx?: Transaction) {
        super(model, toQuestionDetail, toCreateAttrs, toUpdateAttrs, defaultTx);
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
            if (criteria.filters?.subtopicIds && criteria.filters.subtopicIds.length > 0) {
                where['subTopicId'] = { [Op.in]: criteria.filters.subtopicIds };
            } else if (criteria.filters?.subtopicId) {
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

    //Funciones adicionales para generación de exámenes

    private static toQuestionForExam(row: QuestionModel): QuestionForExam {
        const plain = row.get({ plain: true }) as QuestionPlain & {
            primarySubtopic?: { id: string; topicId: string | null; topic?: { id: string | null } };
        };

        const topicId = plain.primarySubtopic?.topic?.id ?? plain.primarySubtopic?.topicId ?? null;
        const subTopicId = plain.subTopicId ?? plain.primarySubtopic?.id ?? null;
        return {
            id: plain.id,
            difficulty: plain.difficulty,
            questionTypeId: plain.questionTypeId,
            subTopicId,
            topicId,
            body: plain.body,
            options: plain.options ?? null,
            response: plain.response ?? null,
        };
    }

    private buildInclude(topicIds?: string[]): Includeable[] {
        const includeEntry: {
            model: typeof Subtopic;
            as: string;
            attributes: string[];
            required: boolean;
            where?: WhereOptions;
        } = {
            model: Subtopic,
            as: 'primarySubtopic',
            attributes: ['id', 'topicId'],
            required: Boolean(topicIds && topicIds.length > 0),
        };

        if (topicIds && topicIds.length > 0) {
            includeEntry.where = { topicId: { [Op.in]: topicIds } };
        }

        return [includeEntry];
    }

    async findByIds(ids: string[], tx?: Transaction): Promise<QuestionForExam[]> {
        try {
            if (!ids.length) return [];
            const rows = await this.model.findAll({
                where: { id: { [Op.in]: ids } },
                include: this.buildInclude(),
                transaction: this.effTx(tx),
            });
            return rows.map((row) => QuestionRepository.toQuestionForExam(row));
        } catch (error) {
            return this.raiseError(error, this.model.name);
        }
    }

    async findRandomByFilters(criteria: QuestionSearchCriteria, tx?: Transaction) {
        try {
            const where: WhereOptions = {};
            if (criteria.difficulty) where.difficulty = criteria.difficulty;
            if (criteria.questionTypeIds && criteria.questionTypeIds.length > 0) {
                where.questionTypeId = { [Op.in]: criteria.questionTypeIds };
            }
            if (criteria.subtopicIds && criteria.subtopicIds.length > 0) {
                where.subTopicId = { [Op.in]: criteria.subtopicIds };
            }
            if (criteria.ids && criteria.ids.length > 0) {
                where.id = { [Op.in]: criteria.ids };
            }
            if (criteria.excludeQuestionIds && criteria.excludeQuestionIds.length > 0) {
                if (!where.id) where.id = {};
                (where.id as Record<symbol | string, unknown>)[Op.notIn] =
                    criteria.excludeQuestionIds;
            }

            let topicFilterIds = criteria.topicIds?.length ? [...criteria.topicIds] : undefined;
            if (criteria.subjectId) {
                const subjectTopics = await SubjectTopic.findAll({
                    attributes: ['topicId'],
                    where: { subjectId: criteria.subjectId },
                    transaction: this.effTx(tx),
                });
                const allowedIds = subjectTopics.map((row) => row.getDataValue('topicId'));
                if (!allowedIds.length) {
                    return [];
                }
                topicFilterIds = topicFilterIds
                    ? topicFilterIds.filter((id) => allowedIds.includes(id))
                    : allowedIds;
                if (!topicFilterIds.length) {
                    return [];
                }
            }

            const rows = await this.model.findAll({
                where,
                include: this.buildInclude(topicFilterIds),
                order: sequelize.random(),
                limit: criteria.limit ?? 20,
                transaction: this.effTx(tx),
            });
            return rows.map((row) => QuestionRepository.toQuestionForExam(row));
        } catch (error) {
            return this.raiseError(error, this.model.name);
        }
    }
}
