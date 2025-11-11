import { ModelStatic, Op, Transaction, WhereOptions } from 'sequelize';

import {
    ISubtopicRepository,
    type ListSubtopicsCriteria,
} from '../../../domains/question-bank/domain/ports/ISubtopicRepository';
import {
    SubtopicDetail,
    subtopicDetailSchema,
    SubtopicCreate,
    subtopicCreateSchema,
} from '../../../domains/question-bank/schemas/subtopicSchema';
import { BaseRepository } from '../../../shared/domain/base_repository';
import { SubTopic as SubTopicModel, Topic as TopicModel } from '../models';

export class SubtopicRepository
    extends BaseRepository<SubTopicModel, any, any, any>
    implements ISubtopicRepository
{
    constructor(model: ModelStatic<SubTopicModel>, defaultTx?: Transaction) {
        super(
            model,
            (r) => r,
            (c) => c,
            (u) => u,
            defaultTx,
        );
    }

    private async rowToDetail(row: SubTopicModel, tx?: Transaction): Promise<SubtopicDetail> {
        const p = row.get({ plain: true }) as { id: string; name: string; topicId: string };
        const topic = await TopicModel.findByPk(p.topicId, { transaction: this.effTx(tx) });
        const topicName = topic ? (topic.get({ plain: true }) as { title: string }).title : '';
        return subtopicDetailSchema.parse({
            subtopic_id: p.id,
            subtopic_name: p.name,
            topic_id: p.topicId,
            topic_name: topicName,
        });
    }

    async paginateDetail(criteria: ListSubtopicsCriteria, tx?: Transaction) {
        try {
            const where: WhereOptions = {};
            if (criteria.filters?.topic_id) where['topicId'] = criteria.filters.topic_id;
            if (criteria.filters?.q) where['name'] = { [Op.like]: `%${criteria.filters.q}%` };

            const limit = criteria.limit ?? 20;
            const offset = criteria.offset ?? 0;

            const { rows, count } = await this.model.findAndCountAll({
                where,
                limit,
                offset,
                order: [['name', 'ASC']],
                transaction: this.effTx(tx),
            });

            const items = [];
            for (const r of rows) items.push(await this.rowToDetail(r, tx));
            return { items, total: count };
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async get_detail_by_id(id: string, tx?: Transaction) {
        try {
            const row = await this.model.findByPk(id, { transaction: this.effTx(tx) });
            if (!row) return null;
            return this.rowToDetail(row, tx);
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async create(dto: SubtopicCreate, tx?: Transaction) {
        try {
            const safe = subtopicCreateSchema.parse(dto);
            const row = await this.model.create(
                { name: safe.name, topicId: safe.topicId },
                { transaction: this.effTx(tx) },
            );
            return this.rowToDetail(row, tx);
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async deleteById(id: string, tx?: Transaction) {
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

    async existsInTopic(topicId: string, name: string, tx?: Transaction) {
        try {
            const found = await this.model.findOne({
                where: { topicId, name },
                transaction: this.effTx(tx),
            });
            return Boolean(found);
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }
}
