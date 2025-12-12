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
import { ISubjectRepository } from '../ports/ISubjectRepository';
import { ITopicRepository, ListTopicsCriteria } from '../ports/ITopicRepository';

type Deps = {
    repo: ITopicRepository;
    subjectRepo: ISubjectRepository;
};

export class TopicService extends BaseDomainService {
    public readonly repo: ITopicRepository;
    private readonly subjectRepo: ISubjectRepository;

    constructor(deps: Deps) {
        super();
        this.repo = deps.repo;
        this.subjectRepo = deps.subjectRepo;
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
            filters: { q: criteria.q, subject_id: criteria.subject_id, active: true },
        };
        const { items, total } = await this.repo.paginateDetail(repoCriteria);
        return { list: items, total };
    }

    async createSubjectTopic(body: CreateSubjectTopicBody): Promise<TopicDetail> {
        const subject = await this.subjectRepo.get_by_id(body.subject_id);
        if (!subject) {
            this.raiseNotFoundError('create-subject-topic', 'No existe la asignatura');
        }

        const topicDetail = await this.repo.get_detail_by_id(body.topic_id);
        if (!topicDetail) {
            this.raiseNotFoundError('create-subject-topic', 'No existe el tema');
        }

        const existing = await this.subjectRepo.existsSubjectTopic(body.subject_id, body.topic_id);
        if (existing) {
            this.raiseBusinessRuleError('create-subject-topic', 'La relación ya existe', {
                entity: 'SubjectTopic',
            });
        }

        await this.subjectRepo.createSubjectTopic(body.subject_id, body.topic_id);

        const detail = await this.repo.get_detail_by_id(body.topic_id);
        if (!detail) {
            this.raiseNotFoundError('create-subject-topic', 'No se obtuvo el link creado');
        }
        return detail;
    }

    async deleteSubjectTopic(body: CreateSubjectTopicBody): Promise<boolean> {
        return this.subjectRepo.deleteSubjectTopic(body.subject_id, body.topic_id);
    }

    async get_detail_by_id(id: string) {
        return this.repo.get_detail_by_id(id);
    }
    async deleteById(id: string) {
        return this.repo.deleteById(id);
    }
}
