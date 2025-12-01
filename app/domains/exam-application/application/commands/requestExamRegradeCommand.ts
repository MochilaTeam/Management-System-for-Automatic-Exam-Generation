import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { ExamAssignmentService } from '../../domain/services/examAssigmentService';
import {
    ExamRegradeOutput,
    RequestExamRegradeCommandSchema,
} from '../../schemas/examRegradeSchema';

export class RequestExamRegradeCommand extends BaseCommand<
    RequestExamRegradeCommandSchema,
    RetrieveOneSchema<ExamRegradeOutput>
> {
    constructor(private readonly svc: ExamAssignmentService) {
        super();
    }

    protected async executeBusinessLogic(
        input: RequestExamRegradeCommandSchema,
    ): Promise<RetrieveOneSchema<ExamRegradeOutput>> {
        const item = await this.svc.requestExamRegrade(input);
        return new RetrieveOneSchema(item, 'Solicitud de recalificación creada', true);
    }
}
