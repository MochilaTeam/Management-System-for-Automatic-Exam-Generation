import { Subject, SubjectTopic, Topic } from '../../../../infrastructure/question-bank/models';
import { BaseDomainService } from '../../../../shared/domain/base_service';
import { CreateSubjectTopicBody } from '../../schemas/subjectTopicSchema';
import {
    CreateTopicBody,
    ListTopics,
    TopicCreate,
    TopicDetail,
    TopicUpdate,
    topicCreateSchema,
    topicUpdateSchema,
    UpdateTopicBody,
} from '../../schemas/topicSchema';
import { ITopicRepository, ListTopicsCriteria } from '../ports/ITopicRepository';

export class TopicService extends BaseDomainService {
    constructor(private readonly repo: ITopicRepository) {
        super()
    }

    private norm(s: string) {
        return s.trim();
    }

    async create(body: CreateTopicBody): Promise<TopicDetail> {
        const title = this.norm(body.topic_name);
        const taken = await this.repo.existsByTitle(title);
        if (taken) throw new Error('TOPIC_TITLE_TAKEN');

        const dto: TopicCreate = topicCreateSchema.parse({
            title,
        });
        return this.repo.create(dto);
    }

    async update(id: string, patch: UpdateTopicBody): Promise<TopicDetail | null> {
        const dto: TopicUpdate = topicUpdateSchema.parse({
            title: patch.topic_name ? this.norm(patch.topic_name) : undefined,
        });
        if (dto.title) {
            const taken = await this.repo.existsByTitle(dto.title);
            if (taken) throw new Error('TOPIC_TITLE_TAKEN');
        }
        return this.repo.update(id, dto);
    }

    async paginateDetail(criteria: ListTopics): Promise<{ list: TopicDetail[]; total: number }> {
        const limit = criteria.limit ?? 20;
        const offset = criteria.offset ?? 0;
        const repoCriteria: ListTopicsCriteria = {
            limit,
            offset,
            filters: { q: criteria.q, subject_id: criteria.subject_id },
        };
        const { items, total } = await this.repo.paginateDetail(repoCriteria);
        return { list: items, total };
    }

    async createSubjectTopic(body: CreateSubjectTopicBody): Promise<TopicDetail> {
        const subject = await Subject.findByPk(body.subject_id);
        if (!subject) this.raiseNotFoundError(
            "create-subject-topic",
            "No existe la asignatura"
        )

        const topic = await Topic.findByPk(body.topic_id);
        if (!topic) this.raiseNotFoundError(
            "create-subject-topic",
            "No existe el tema"
        )

        const existing = await SubjectTopic.findOne({
            where: { subjectId: body.subject_id, topicId: body.topic_id },
        });
        if (existing) {
            this.raiseBusinessRuleError(
                "create-subject-topic",
                "La relación ya existe",
                { entity: "SubjectTopic" }
            )
        }

        await SubjectTopic.create({ subjectId: body.subject_id, topicId: body.topic_id });

        const detail = await this.repo.get_detail_by_id(body.topic_id);
        if (!detail) this.raiseNotFoundError(
            "create-subject-topic",
            "No se obtuvo el link creado"
        )
        return detail;
    }

    async get_detail_by_id(id: string) {
        return this.repo.get_detail_by_id(id);
    }
    async deleteById(id: string) {
        return this.repo.deleteById(id);
    }
}
