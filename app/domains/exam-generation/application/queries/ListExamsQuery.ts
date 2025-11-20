import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { ExamService } from '../../domain/services/examService';
import { ExamRead, ListExamsQuerySchema } from '../../schemas/examSchema';

export class ListExamsQuery extends BaseQuery<
    ListExamsQuerySchema,
    PaginatedSchema<ExamRead>
> {
    constructor(private readonly svc: ExamService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ListExamsQuerySchema,
    ): Promise<PaginatedSchema<ExamRead>> {
        const limit = input.limit ?? 20;
        const offset = input.offset ?? 0;
        const { list, total } = await this.svc.paginate(input);
        return new PaginatedSchema(list, { limit, offset, total });
    }
}
