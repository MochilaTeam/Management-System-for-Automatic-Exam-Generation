import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { QuestionService } from '../../domain/services/questionService';
import { ListQuestions, QuestionDetail } from '../../schemas/questionSchema';

export class ListQuestionsQuery extends BaseQuery<ListQuestions, PaginatedSchema<QuestionDetail>> {
    constructor(private readonly svc: QuestionService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ListQuestions,
    ): Promise<PaginatedSchema<QuestionDetail>> {
        const limit = input.limit ?? 20;
        const offset = input.offset ?? 0;
        const { list, total } = await this.svc.paginateDetail(input);
        return new PaginatedSchema(list, { limit, offset, total });
    }
}
