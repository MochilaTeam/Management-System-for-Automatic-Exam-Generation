import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { ExamAssignmentService } from '../../domain/services/examAssigmentService';
import {
    ListEvaluatorExamsQuery as ListEvaluatorExamsInput,
    StudentExamAssignmentItem,
} from '../../schemas/examAssignmentSchema';

export class ListEvaluatorExamsQuery extends BaseQuery<
    ListEvaluatorExamsInput,
    PaginatedSchema<StudentExamAssignmentItem>
> {
    constructor(private readonly service: ExamAssignmentService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ListEvaluatorExamsInput,
    ): Promise<PaginatedSchema<StudentExamAssignmentItem>> {
        const limit = input.limit ?? 10;
        const page = input.page ?? 1;
        const offset = (page - 1) * limit;

        const { items, total } = await this.service.listEvaluatorExams({
            currentUserId: input.currentUserId,
            page: input.page,
            limit: input.limit,
        });

        return new PaginatedSchema(items, { limit, offset, total });
    }
}
