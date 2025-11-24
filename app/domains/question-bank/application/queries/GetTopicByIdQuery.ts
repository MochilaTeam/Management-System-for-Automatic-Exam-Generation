import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { TopicService } from '../../domain/services/topicService';
import { TopicDetail } from '../../schemas/topicSchema';

type Input = { topicId: string };
export class GetTopicByIdQuery extends BaseQuery<Input, RetrieveOneSchema<TopicDetail>> {
    constructor(private readonly svc: TopicService) {
        super();
    }
    protected async executeBusinessLogic(input: Input) {
        const item = await this.svc.get_detail_by_id(input.topicId);
        if (!item) throw new NotFoundError({ message: 'TOPIC_NOT_FOUND' });
        return new RetrieveOneSchema(item);
    }
}
