import { RetrieveOneSchema } from "../../../../shared/domain/base_response";
import { BaseCommand } from "../../../../shared/domain/base_use_case";
import { ExamResponseService } from "../../domain/services/examResponseService";
import { CreateExamResponseCommandSchema, ExamResponseOutput } from "../../schemas/examResponseSchema";

export class CreateExamResponseCommand extends BaseCommand<
    CreateExamResponseCommandSchema,
    RetrieveOneSchema<ExamResponseOutput>
> {
    constructor(private readonly svc: ExamResponseService) {
        super();
    }

    protected async executeBusinessLogic(
        input: CreateExamResponseCommandSchema,
    ): Promise<RetrieveOneSchema<ExamResponseOutput>> {
        const item = await this.svc.createExamResponse(input);
        return new RetrieveOneSchema(item, 'Exam response created', true);
    }
}
