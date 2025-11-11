import { SubtopicCreate, SubtopicDetail } from "../../schemas/subtopicSchema";

export type SubtopicFilters = {
  q?: string;
  topic_id?: string;
};

export type ListSubtopicsCriteria = {
  offset?: number;
  limit?: number;
  filters?: SubtopicFilters;
};

export type Page<T> = { items: T[]; total: number };

export interface ISubtopicRepository {
  paginateDetail(criteria: ListSubtopicsCriteria): Promise<Page<SubtopicDetail>>;
  get_detail_by_id(id: string): Promise<SubtopicDetail | null>;
  create(data: SubtopicCreate): Promise<SubtopicDetail>;
  deleteById(id: string): Promise<boolean>;
  existsInTopic(topicId: string, name: string): Promise<boolean>;
}
