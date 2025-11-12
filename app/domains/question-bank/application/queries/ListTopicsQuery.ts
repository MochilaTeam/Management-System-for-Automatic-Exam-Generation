import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { TopicService } from '../../domain/services/topicService';
import { ListTopics, TopicDetail } from '../../schemas/topicSchema';

export class ListTopicsQuery extends BaseQuery<ListTopics, PaginatedSchema<TopicDetail>> {
    constructor(private readonly svc: TopicService) {
        super();
    }
    protected async executeBusinessLogic(input: ListTopics) {
        const limit = input.limit ?? 20;
        const offset = input.offset ?? 0;
        const { list, total } = await this.svc.paginateDetail(input);
        return new PaginatedSchema(list, { limit, offset, total });
    }
}
