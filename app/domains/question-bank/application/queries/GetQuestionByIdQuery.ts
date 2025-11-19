import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { QuestionService } from '../../domain/services/questionService';
import { QuestionDetail, QuestionIdParams } from '../../schemas/questionSchema';

export class GetQuestionByIdQuery extends BaseQuery<
    QuestionIdParams,
    RetrieveOneSchema<QuestionDetail>
> {
    constructor(private readonly svc: QuestionService) {
        super();
    }

    protected async executeBusinessLogic(
        input: QuestionIdParams,
    ): Promise<RetrieveOneSchema<QuestionDetail>> {
        const question = await this.svc.get_detail_by_id(input.questionId);
        if (!question) {
            throw new NotFoundError({ message: 'QUESTION_NOT_FOUND' });
        }
        return new RetrieveOneSchema(question);
    }
}
