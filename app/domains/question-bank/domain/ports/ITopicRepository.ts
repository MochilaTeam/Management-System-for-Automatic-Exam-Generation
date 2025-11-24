import { TopicCreate, TopicDetail, TopicUpdate } from '../../schemas/topicSchema';

export type TopicFilters = {
    q?: string;
    subject_id?: string;
};

export type ListTopicsCriteria = {
    offset?: number;
    limit?: number;
    filters?: TopicFilters;
};

export type Page<T> = { items: T[]; total: number };

export interface ITopicRepository {
    paginateDetail(criteria: ListTopicsCriteria): Promise<Page<TopicDetail>>;
    get_detail_by_id(id: string): Promise<TopicDetail | null>;

    create(data: TopicCreate): Promise<TopicDetail>;
    update(id: string, patch: TopicUpdate): Promise<TopicDetail | null>;
    deleteById(id: string): Promise<boolean>;

    existsByTitle(title: string): Promise<boolean>;
}
