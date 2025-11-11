import {
  CreateTopicBody,
  UpdateTopicBody,
  TopicCreate,
  TopicUpdate,
  TopicDetail,
  listTopicsQuerySchema,
  topicCreateSchema,
  topicUpdateSchema,
  ListTopics,
} from "../../schemas/topicSchema";
import { ITopicRepository, ListTopicsCriteria } from "../ports/ITopicRepository";
import {Subject} from "../../../../infrastructure/question-bank/models";

type Deps = { repo: ITopicRepository };

export class TopicService {
  constructor(private readonly repo: ITopicRepository) {}

  private norm(s: string) { return s.trim(); }

  async create(body: CreateTopicBody): Promise<TopicDetail> {
    const subject = await Subject.findByPk(body.subject_associated_id);
    if (!subject) throw new Error("SUBJECT_NOT_FOUND");

    const title = this.norm(body.topic_name);
    const taken = await this.repo.existsByTitle(title);
    if (taken) throw new Error("TOPIC_TITLE_TAKEN");

    const dto: TopicCreate = topicCreateSchema.parse({
      title,
      firstSubjectId: body.subject_associated_id,
    });
    return this.repo.create(dto);
  }

  async update(id: string, patch: UpdateTopicBody): Promise<TopicDetail | null> {
    const dto: TopicUpdate = topicUpdateSchema.parse({
      title: patch.topic_name ? this.norm(patch.topic_name) : undefined,
    });
    if (dto.title) {
      const taken = await this.repo.existsByTitle(dto.title);
      if (taken) throw new Error("TOPIC_TITLE_TAKEN");
    }
    return this.repo.update(id, dto);
  }

  async paginateDetail(criteria: ListTopics): Promise<{ list: TopicDetail[]; total: number }> {
    const limit = criteria.limit ?? 20;
    const offset = criteria.offset ?? 0;
    const repoCriteria: ListTopicsCriteria = {
      limit, offset,
      filters: { q: criteria.q, subject_id: criteria.subject_id },
    };
    const { items, total } = await this.repo.paginateDetail(repoCriteria);
    return { list: items, total };
  }

  async get_detail_by_id(id: string) { return this.repo.get_detail_by_id(id); }
  async deleteById(id: string) { return this.repo.deleteById(id); }
}
