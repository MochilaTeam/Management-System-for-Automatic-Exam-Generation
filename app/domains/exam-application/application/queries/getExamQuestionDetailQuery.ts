import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { QuestionDetail } from '../../../question-bank/schemas/questionSchema';
import { ExamResponseService } from '../../domain/services/examResponseService';
import { GetExamQuestionDetailQuerySchema } from '../../schemas/examResponseSchema';

export class GetExamQuestionDetailQuery extends BaseQuery<
    GetExamQuestionDetailQuerySchema,
    RetrieveOneSchema<QuestionDetail>
> {
    constructor(private readonly svc: ExamResponseService) {
        super();
    }

    protected async executeBusinessLogic(
        input: GetExamQuestionDetailQuerySchema,
    ): Promise<RetrieveOneSchema<QuestionDetail>> {
        const question = await this.svc.getQuestionDetailByIndex(input);
        return new RetrieveOneSchema(question, 'Exam question retrieved', true);
    }
}
