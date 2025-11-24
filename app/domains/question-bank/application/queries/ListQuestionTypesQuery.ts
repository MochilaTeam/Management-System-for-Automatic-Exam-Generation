// src/domains/question-bank/application/queries/ListQuestionTypesQuery.ts
import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { QuestionTypeService } from '../../domain/services/questionTypeService';
import { ListQuestionTypes, QuestionTypeRead } from '../../schemas/questionTypeSchema';

export class ListQuestionTypesQuery extends BaseQuery<
    ListQuestionTypes,
    PaginatedSchema<QuestionTypeRead>
> {
    constructor(private readonly serv: QuestionTypeService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ListQuestionTypes,
    ): Promise<PaginatedSchema<QuestionTypeRead>> {
        const limit = input.limit ?? 20;
        const offset = input.offset ?? 0;
        const { list, total } = await this.serv.paginate(input);
        return new PaginatedSchema(list, { limit, offset, total });
    }
}
