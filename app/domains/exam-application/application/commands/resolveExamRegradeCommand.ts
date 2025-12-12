import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { ExamAssignmentService } from '../../domain/services/examAssigmentService';
import { CalculateExamGradeResult } from '../../schemas/examAssignmentSchema';
import { ResolveExamRegradeCommandSchema } from '../../schemas/examRegradeSchema';

export class ResolveExamRegradeCommand extends BaseCommand<
    ResolveExamRegradeCommandSchema,
    RetrieveOneSchema<CalculateExamGradeResult>
> {
    constructor(private readonly svc: ExamAssignmentService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ResolveExamRegradeCommandSchema,
    ): Promise<RetrieveOneSchema<CalculateExamGradeResult>> {
        const result = await this.svc.resolveExamRegrade(input);
        return new RetrieveOneSchema(result, 'Recalificación finalizada', true);
    }
}
