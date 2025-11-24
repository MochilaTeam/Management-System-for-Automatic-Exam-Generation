import { ModelStatic, Transaction } from 'sequelize';

import {
    ISubjectRepository,
    type ListSubjectsCriteria,
} from '../../../domains/question-bank/domain/ports/ISubjectRepository';
import {
    type SubjectRead,
    type SubjectCreate,
    type SubjectUpdate,
    subjectDetailSchema,
    type SubjectDetail,
    subTopicDetailSchema,
    topicDetailSchema,
} from '../../../domains/question-bank/schemas/subjectSchema';
import { BaseRepository } from '../../../shared/domain/base_repository';
import { Teacher } from '../../user/models';
import { SubjectMapper } from '../mappers/subjectMapper';
import {
    Subject as SubjectModel,
    Topic as TopicModel,
    SubTopic as SubTopicModel,
    SubjectTopic as SubjectTopicModel,
} from '../models';

// Tipos planos para evitar `any`
type TeacherPlain = { name?: string; firstName?: string; lastName?: string };
type SubjectTopicPlain = { subjectId: string; topicId: string };
type TopicPlain = { id: string; title: string };
type SubtopicPlain = { id: string; name: string };
type SubjectLeadPlain = { leadTeacherId: string | null };

// Cuando listamos, `SubjectRead` no trae `leadTeacherId`,
// así que definimos un tipo auxiliar con el campo opcional.
type SubjectListItem = SubjectRead & { leadTeacherId?: string | null };

export class SubjectRepository
    extends BaseRepository<SubjectModel, SubjectRead, SubjectCreate, SubjectUpdate>
    implements ISubjectRepository
{
    constructor(model: ModelStatic<SubjectModel>, defaultTx?: Transaction) {
        super(
            model,
            SubjectMapper.toRead.bind(SubjectMapper),
            SubjectMapper.toCreateAttrs.bind(SubjectMapper),
            SubjectMapper.toUpdateAttrs.bind(SubjectMapper),
            defaultTx,
        );
    }

    static withTx(model: ModelStatic<SubjectModel>, tx: Transaction) {
        return new SubjectRepository(model, tx);
    }

    // --- helpers privados ---

    private async buildDetailForSubject(
        subj: { id: string; name: string; program: string; leadTeacherId: string | null },
        tx?: Transaction,
    ): Promise<SubjectDetail> {
        // líder
        let leaderName = '';
        if (subj.leadTeacherId) {
            const teacher = await Teacher.findByPk(subj.leadTeacherId, {
                transaction: this.effTx(tx),
            });
            if (teacher) {
                const t = teacher.get({ plain: true }) as TeacherPlain;
                leaderName = t.name ?? [t.firstName, t.lastName].filter(Boolean).join(' ') ?? '';
            }
        }

        // topics asociados por la tabla puente
        const subjectTopics = await SubjectTopicModel.findAll({
            where: { subjectId: subj.id },
            transaction: this.effTx(tx),
        });
        const topicIds = subjectTopics.map(
            (st) => (st.get({ plain: true }) as SubjectTopicPlain).topicId,
        );

        const topics = topicIds.length
            ? await TopicModel.findAll({ where: { id: topicIds }, transaction: this.effTx(tx) })
            : [];

        const topicDetails: Array<ReturnType<typeof topicDetailSchema.parse>> = [];
        for (const topic of topics) {
            const t = topic.get({ plain: true }) as TopicPlain;

            const subs = await SubTopicModel.findAll({
                where: { topicId: t.id },
                transaction: this.effTx(tx),
            });

            const subDetails = subs.map((s) => {
                const sp = s.get({ plain: true }) as SubtopicPlain;
                return subTopicDetailSchema.parse({
                    subtopic_id: sp.id,
                    subtopic_name: sp.name,
                });
            });

            const td = topicDetailSchema.parse({
                topic_id: t.id,
                topic_name: t.title,
                subject_id: subj.id,
                subject_name: subj.name,
                subtopics_amount: subDetails.length,
                subtopics: subDetails,
            });
            topicDetails.push(td);
        }

        return subjectDetailSchema.parse({
            subject_id: subj.id,
            subject_name: subj.name,
            subject_program: subj.program,
            subject_leader_name: leaderName,
            topics_amount: topicDetails.length,
            topics: topicDetails,
        });
    }

    // --- métodos públicos existentes ---

    async paginate(criteria: ListSubjectsCriteria, tx?: Transaction) {
        const opts = SubjectMapper.toOptions(criteria);
        return this.paginateByOptions(
            { where: opts.where, order: opts.order, limit: opts.limit, offset: opts.offset },
            tx,
        );
    }

    async list(criteria: ListSubjectsCriteria, tx?: Transaction) {
        const opts = SubjectMapper.toOptions(criteria);
        return this.listByOptions(
            { where: opts.where, order: opts.order, limit: opts.limit, offset: opts.offset },
            tx,
        );
    }

    async existsBy(
        filters: Parameters<typeof SubjectMapper.toWhereFromFilters>[0],
        tx?: Transaction,
    ) {
        const where = SubjectMapper.toWhereFromFilters(filters);
        return super.exists(where, tx);
    }

    async deleteById(id: string, tx?: Transaction): Promise<boolean> {
        const deleted = await this.model.destroy({ where: { id }, transaction: this.effTx(tx) });
        return deleted > 0;
    }

    async existsSubjectTopic(subjectId: string, topicId: string, tx?: Transaction) {
        const found = await SubjectTopicModel.findOne({
            where: { subjectId, topicId },
            transaction: this.effTx(tx),
        });
        return Boolean(found);
    }

    async createSubjectTopic(subjectId: string, topicId: string, tx?: Transaction) {
        await SubjectTopicModel.create({ subjectId, topicId }, { transaction: this.effTx(tx) });
    }

    async deleteSubjectTopic(subjectId: string, topicId: string, tx?: Transaction) {
        const deleted = await SubjectTopicModel.destroy({
            where: { subjectId, topicId },
            transaction: this.effTx(tx),
        });
        return deleted > 0;
    }

    async get_detail_by_id(id: string, tx?: Transaction): Promise<SubjectDetail | null> {
        try {
            const subjectRow = await this.model.findByPk(id, { transaction: this.effTx(tx) });
            if (!subjectRow) return null;
            const subj = subjectRow.get({ plain: true }) as {
                id: string;
                name: string;
                program: string;
                leadTeacherId: string | null;
            };
            return this.buildDetailForSubject(subj, tx);
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async paginateDetail(
        criteria: ListSubjectsCriteria,
        tx?: Transaction,
    ): Promise<{ items: SubjectDetail[]; total: number }> {
        try {
            // 1) paginamos subjects “simples”
            const { items: subjects, total } = await this.paginate(criteria, tx);

            // 2) construimos el detail de cada uno
            const details: SubjectDetail[] = [];
            for (const s of subjects) {
                const subjList = s as SubjectListItem;

                // Si no tenemos leadTeacherId en el read, lo resolvemos consultando por id
                let leadTeacherId: string | null = null;
                if (subjList.leadTeacherId !== undefined) {
                    leadTeacherId = subjList.leadTeacherId ?? null;
                } else {
                    const full = await this.model.findByPk(subjList.id, {
                        transaction: this.effTx(tx),
                    });
                    const lead = full ? (full.get({ plain: true }) as SubjectLeadPlain) : null;
                    leadTeacherId = lead ? lead.leadTeacherId : null;
                }

                const subj = {
                    id: s.id,
                    name: s.name,
                    program: s.program,
                    leadTeacherId,
                };
                const detail = await this.buildDetailForSubject(subj, tx);
                details.push(detail);
            }
            return { items: details, total };
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }
}
