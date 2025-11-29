import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { ExamService } from '../../domain/services/examService';
import { CreateManualExamCommandSchema, ExamDetailRead } from '../../schemas/examSchema';

export class CreateManualExamCommand extends BaseCommand<
    CreateManualExamCommandSchema,
    RetrieveOneSchema<ExamDetailRead>
> {
    constructor(private readonly svc: ExamService) {
        super();
    }

    protected async executeBusinessLogic(
        input: CreateManualExamCommandSchema,
    ): Promise<RetrieveOneSchema<ExamDetailRead>> {
        const detail = await this.svc.createManualExam(input);
        return new RetrieveOneSchema(detail, 'Examen creado manualmente', true);
    }
}
