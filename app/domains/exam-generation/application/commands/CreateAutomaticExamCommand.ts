import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { ExamService } from '../../domain/services/examService';
import { AutomaticExamPreview, CreateAutomaticExamCommandSchema } from '../../schemas/examSchema';

export class CreateAutomaticExamCommand extends BaseCommand<
    CreateAutomaticExamCommandSchema,
    RetrieveOneSchema<AutomaticExamPreview>
> {
    constructor(private readonly svc: ExamService) {
        super();
    }

    protected async executeBusinessLogic(
        input: CreateAutomaticExamCommandSchema,
    ): Promise<RetrieveOneSchema<AutomaticExamPreview>> {
        const detail = await this.svc.createAutomaticExam(input);
        return new RetrieveOneSchema(detail, 'Propuesta de examen generada automáticamente', true);
    }
}
