import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { SubtopicService } from '../../domain/services/subtopicService';
import { SubtopicDetail } from '../../schemas/subtopicSchema';

export class CreateSubtopicCommand extends BaseCommand<unknown, RetrieveOneSchema<SubtopicDetail>> {
    constructor(private readonly svc: SubtopicService) {
        super();
    }
    protected async executeBusinessLogic(input: unknown) {
        const item = await this.svc.create(input);
        return new RetrieveOneSchema(item, 'Subtopic created', true);
    }
}
