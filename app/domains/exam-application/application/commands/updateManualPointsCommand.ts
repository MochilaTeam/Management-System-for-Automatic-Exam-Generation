import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { ExamResponseService } from '../../domain/services/examResponseService';
import { UpdateManualPointsCommandSchema } from '../../schemas/examResponseSchema';

export class UpdateManualPointsCommand extends BaseCommand<
    UpdateManualPointsCommandSchema,
    RetrieveOneSchema<null>
> {
    constructor(private readonly svc: ExamResponseService) {
        super();
    }

    protected async executeBusinessLogic(
        input: UpdateManualPointsCommandSchema,
    ): Promise<RetrieveOneSchema<null>> {
        await this.svc.updateManualPoints(input);
        return new RetrieveOneSchema(null, 'Manual points updated', true);
    }
}
