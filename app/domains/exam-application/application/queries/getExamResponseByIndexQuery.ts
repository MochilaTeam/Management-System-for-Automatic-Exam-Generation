import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { ExamResponseService } from '../../domain/services/examResponseService';
import {
    ExamResponseOutput,
    GetExamResponseByIndexQuerySchema,
} from '../../schemas/examResponseSchema';

export class GetExamResponseByIndexQuery extends BaseQuery<
    GetExamResponseByIndexQuerySchema,
    RetrieveOneSchema<ExamResponseOutput>
> {
    constructor(private readonly svc: ExamResponseService) {
        super();
    }

    protected async executeBusinessLogic(
        input: GetExamResponseByIndexQuerySchema,
    ): Promise<RetrieveOneSchema<ExamResponseOutput>> {
        const item = await this.svc.getResponseByQuestionIndex(input);
        return new RetrieveOneSchema(item, 'Exam response retrieved', true);
    }
}
