// src/domains/question-bank/application/queries/GetQuestionTypeByIdQuery.ts
import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { QuestionTypeService } from '../../domain/services/questionTypeService';
import { QuestionTypeIdParams, QuestionTypeRead } from '../../schemas/questionTypeSchema';

export class GetQuestionTypeByIdQuery extends BaseQuery<
    QuestionTypeIdParams,
    RetrieveOneSchema<QuestionTypeRead>
> {
    constructor(private readonly serv: QuestionTypeService) {
        super();
    }

    protected async executeBusinessLogic(
        input: QuestionTypeIdParams,
    ): Promise<RetrieveOneSchema<QuestionTypeRead>> {
        const qt = await this.serv.repo.get_by_id(input.questionTypeId);
        if (!qt) throw new NotFoundError({ message: 'Tipo de pregunta no encontrado' });
        return new RetrieveOneSchema(qt);
    }
}
