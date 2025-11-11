import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { SubtopicService } from '../../domain/services/subtopicService';
import { ListSubtopics, SubtopicDetail } from '../../schemas/subtopicSchema';

export class ListSubtopicsQuery extends BaseQuery<ListSubtopics, PaginatedSchema<SubtopicDetail>> {
    constructor(private readonly svc: SubtopicService) {
        super();
    }
    protected async executeBusinessLogic(input: ListSubtopics) {
        const limit = input.limit ?? 20;
        const offset = input.offset ?? 0;
        const { list, total } = await this.svc.paginateDetail(input);
        return new PaginatedSchema(list, { limit, offset, total });
    }
}
