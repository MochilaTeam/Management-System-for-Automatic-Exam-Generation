import { ModelStatic, Op, Transaction, WhereOptions } from 'sequelize';

import {
    ITopicRepository,
    ListTopicsCriteria,
} from '../../../domains/question-bank/domain/ports/ITopicRepository';
import {
    TopicCreate,
    TopicDetail,
    TopicUpdate,
    topicDetailSchema,
    topicCreateSchema,
    topicUpdateSchema,
} from '../../../domains/question-bank/schemas/topicSchema';
import { BaseRepository } from '../../../shared/domain/base_repository';
import {
    Topic as TopicModel,
    SubTopic as SubTopicModel,
    Subject as SubjectModel,
    SubjectTopic as SubjectTopicModel,
} from '../models';

type TopicPlain = { id: string; title: string };
type SubjectPlain = { id: string; name: string };
type SubtopicPlain = { id: string; name: string };
type SubjectTopicPlain = { subjectId: string; topicId: string };

export class TopicRepository
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extends BaseRepository<TopicModel, any, any, any>
    implements ITopicRepository
{
    constructor(model: ModelStatic<TopicModel>, defaultTx?: Transaction) {
        super(
            model,
            (r) => r,
            (c) => c,
            (u) => u,
            defaultTx,
        );
    }

    private async buildDetail(topicRow: TopicModel, tx?: Transaction): Promise<TopicDetail> {
        const t = topicRow.get({ plain: true }) as TopicPlain;

        // subjects asociados (pivot)
        const pivots = await SubjectTopicModel.findAll({
            where: { topicId: t.id, active: true },
            transaction: this.effTx(tx),
        });
        const subjectIds = pivots.map(
            (p) => (p.get({ plain: true }) as SubjectTopicPlain).subjectId,
        );

        const subjects = subjectIds.length
            ? await SubjectModel.findAll({
                  where: { id: subjectIds, active: true },
                  transaction: this.effTx(tx),
              })
            : [];

        const subjectsArr = subjects.map((s) => {
            const sp = s.get({ plain: true }) as SubjectPlain;
            return { subject_id: sp.id, subject_name: sp.name };
        });

        // subtopics del topic
        const subs = await SubTopicModel.findAll({
            where: { topicId: t.id },
            transaction: this.effTx(tx),
        });
        const subArr = subs.map((s) => {
            const sp = s.get({ plain: true }) as SubtopicPlain;
            return { subtopic_id: sp.id, subtopic_name: sp.name };
        });

        return topicDetailSchema.parse({
            topic_id: t.id,
            topic_name: t.title,
            subjects_amount: subjectsArr.length,
            subjects: subjectsArr,
            subtopics_amount: subArr.length,
            subtopics: subArr,
        });
    }

    async paginateDetail(criteria: ListTopicsCriteria, tx?: Transaction) {
        try {
            const where: WhereOptions = { active: criteria.filters?.active ?? true };
            if (criteria.filters?.q) where['title'] = { [Op.like]: `%${criteria.filters.q}%` };

            // Filtrar por subject asociado (vía pivot)
            if (criteria.filters?.subject_id) {
                const pivots = await SubjectTopicModel.findAll({
                    where: { subjectId: criteria.filters.subject_id, active: true },
                    transaction: this.effTx(tx),
                    attributes: ['topicId'],
                });
                const topicIds = pivots.map(
                    (p) => (p.get({ plain: true }) as SubjectTopicPlain).topicId,
                );
                Object.assign(where, { id: topicIds.length ? topicIds : '__none__' });
            }

            const limit = criteria.limit ?? 20;
            const offset = criteria.offset ?? 0;

            const { rows, count } = await this.model.findAndCountAll({
                where,
                limit,
                offset,
                order: [['title', 'ASC']],
                transaction: this.effTx(tx),
            });

            const items: TopicDetail[] = [];
            for (const r of rows) items.push(await this.buildDetail(r, tx));
            return { items, total: count };
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async get_detail_by_id(id: string, tx?: Transaction) {
        try {
            const row = await this.model.findByPk(id, { transaction: this.effTx(tx) });
            if (!row) return null;
            return this.buildDetail(row, tx);
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async create(dto: TopicCreate, tx?: Transaction) {
        try {
            const safe = topicCreateSchema.parse(dto);
            const topic = await this.model.create(
                { title: safe.title },
                {
                    transaction: this.effTx(tx),
                },
            );
            return this.buildDetail(topic, tx);
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async update(id: string, patch: TopicUpdate, tx?: Transaction) {
        try {
            const safe = topicUpdateSchema.parse(patch);
            if (Object.keys(safe).length === 0) return this.get_detail_by_id(id, tx);

            const [n] = await this.model.update(safe, {
                where: { id },
                transaction: this.effTx(tx),
            });
            if (!n) return null;
            const row = await this.model.findByPk(id, { transaction: this.effTx(tx) });
            if (!row) return null;
            return this.buildDetail(row, tx);
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async deleteById(id: string, tx?: Transaction) {
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

    async existsByTitle(title: string, tx?: Transaction) {
        try {
            const found = await this.model.findOne({
                where: { title, active: true },
                transaction: this.effTx(tx),
            });
            return Boolean(found);
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }
}
