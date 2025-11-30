import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { ExamResponseService } from '../../domain/services/examResponseService';
import {
    ExamResponseOutput,
    UpdateExamResponseCommandSchema,
} from '../../schemas/examResponseSchema';

export class UpdateExamResponseCommand extends BaseCommand<
    UpdateExamResponseCommandSchema,
    RetrieveOneSchema<ExamResponseOutput>
> {
    constructor(private readonly svc: ExamResponseService) {
        super();
    }

    protected async executeBusinessLogic(
        input: UpdateExamResponseCommandSchema,
    ): Promise<RetrieveOneSchema<ExamResponseOutput>> {
        const item = await this.svc.updateExamResponse(input);
        return new RetrieveOneSchema(item, 'Exam response updated', true);
    }
}
