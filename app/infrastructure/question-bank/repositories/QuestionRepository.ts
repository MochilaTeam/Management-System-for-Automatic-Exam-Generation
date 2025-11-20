import { Includeable, ModelStatic, Op, Transaction, WhereOptions } from 'sequelize';

import {
    IQuestionRepository,
    QuestionForExam,
    QuestionSearchCriteria,
} from '../../../domains/exam-application/domain/ports/IQuestionRepository';
import { DifficultyLevelEnum } from '../../../domains/question-bank/entities/enums/DifficultyLevels';
import { sequelize } from '../../../database/database';
import { BaseRepository } from '../../../shared/domain/base_repository';
import Question from '../models/Question';
import Subject from '../models/Subject';
import Subtopic from '../models/SubTopic';
import Topic from '../models/Topic';

export class QuestionRepository
    extends BaseRepository<Question, QuestionForExam, QuestionForExam, QuestionForExam>
    implements IQuestionRepository
{
    constructor(model: ModelStatic<Question>, defaultTx?: Transaction) {
        super(model, QuestionRepository.toQuestionForExam, () => ({}), () => ({}), defaultTx);
    }

    private static toQuestionForExam(row: Question): QuestionForExam {
        const plain = row.get({ plain: true }) as {
            id: string;
            difficulty: DifficultyLevelEnum;
            questionTypeId: string;
            subTopicId: string | null;
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
        };
    }

    private buildInclude(subjectId?: string, topicIds?: string[]): Includeable[] {
        const topicInclude: {
            model: typeof Topic;
            as: string;
            attributes: string[];
            required: boolean;
            include: Includeable[];
            where?: WhereOptions;
        } = {
            model: Topic,
            as: 'topic',
            attributes: ['id'],
            required: Boolean(subjectId || (topicIds && topicIds.length > 0)),
            include: [],
        };

        if (topicIds && topicIds.length > 0) {
            topicInclude.where = {
                id: { [Op.in]: topicIds },
            };
        }

        if (subjectId) {
            topicInclude.include.push({
                model: Subject,
                as: 'subjects',
                attributes: ['id'],
                through: { attributes: [] },
                where: { id: subjectId },
                required: true,
            });
        }

        return [
            {
                model: Subtopic,
                as: 'primarySubtopic',
                attributes: ['id', 'topicId'],
                include: [topicInclude],
                required: false,
            },
        ];
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
                (where.id as Record<symbol | string, unknown>)[Op.notIn] = criteria.excludeQuestionIds;
            }

            const rows = await this.model.findAll({
                where,
                include: this.buildInclude(criteria.subjectId, criteria.topicIds),
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
