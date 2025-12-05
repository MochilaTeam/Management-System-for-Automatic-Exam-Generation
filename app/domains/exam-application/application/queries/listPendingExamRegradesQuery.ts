import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { ExamAssignmentService } from '../../domain/services/examAssigmentService';
import {
    ListPendingExamRegradesQuery as ListPendingExamRegradesInput,
    PendingExamRegradeItem,
} from '../../schemas/examRegradeSchema';

export class ListPendingExamRegradesQuery extends BaseQuery<
    ListPendingExamRegradesInput,
    PaginatedSchema<PendingExamRegradeItem>
> {
    constructor(private readonly service: ExamAssignmentService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ListPendingExamRegradesInput,
    ): Promise<PaginatedSchema<PendingExamRegradeItem>> {
        const limit = input.limit ?? 10;
        const page = input.page ?? 1;
        const offset = (page - 1) * limit;

        const { items, total } = await this.service.listPendingExamRegrades({
            currentUserId: input.currentUserId,
            page,
            limit,
        });

        return new PaginatedSchema(items, { limit, offset, total });
    }
}
