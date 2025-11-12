import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { SubtopicService } from '../../domain/services/subtopicService';
import { SubtopicDetail } from '../../schemas/subtopicSchema';

type Input = { subtopicId: string };
export class GetSubtopicByIdQuery extends BaseQuery<Input, RetrieveOneSchema<SubtopicDetail>> {
    constructor(private readonly svc: SubtopicService) {
        super();
    }
    protected async executeBusinessLogic(input: Input) {
        const item = await this.svc.get_detail_by_id(input.subtopicId);
        if (!item) throw new NotFoundError({ message: 'SUBTOPIC_NOT_FOUND' });
        return new RetrieveOneSchema(item);
    }
}
