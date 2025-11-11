import {
  createSubtopicBodySchema,
  subtopicCreateSchema,
  SubtopicCreate,
  SubtopicDetail,
  ListSubtopics,
} from "../../schemas/subtopicSchema";
import { ISubtopicRepository, ListSubtopicsCriteria } from "../ports/ISubtopicRepository";
import {Topic} from "../../../../infrastructure/question-bank/models"; // para validar existencia

type Deps = { repo: ISubtopicRepository };

export class SubtopicService {
  constructor(private readonly repo: ISubtopicRepository) {}

  private norm(s: string) { return s.trim(); }

  async create(raw: unknown): Promise<SubtopicDetail> {
    const body = createSubtopicBodySchema.parse(raw);
    // validar topic existe
    const topic = await Topic.findByPk(body.topic_associated_id);
    if (!topic) throw new Error("TOPIC_NOT_FOUND");

    const name = this.norm(body.subtopic_name);
    const exists = await this.repo.existsInTopic(body.topic_associated_id, name);
    if (exists) throw new Error("SUBTOPIC_ALREADY_EXISTS_IN_TOPIC");

    const dto: SubtopicCreate = subtopicCreateSchema.parse({
      topicId: body.topic_associated_id,
      name,
    });
    return this.repo.create(dto);
  }

  async paginateDetail(criteria: ListSubtopics): Promise<{ list: SubtopicDetail[]; total: number }> {
    const limit = criteria.limit ?? 20;
    const offset = criteria.offset ?? 0;
    const repoCriteria: ListSubtopicsCriteria = {
      limit, offset,
      filters: { q: criteria.q, topic_id: criteria.topic_id },
    };
    const { items, total } = await this.repo.paginateDetail(repoCriteria);
    return { list: items, total };
  }

  async get_detail_by_id(id: string) {
    return this.repo.get_detail_by_id(id);
  }

  async deleteById(id: string) {
    return this.repo.deleteById(id);
  }
}
