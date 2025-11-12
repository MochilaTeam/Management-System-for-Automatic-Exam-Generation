import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { TopicService } from '../../domain/services/topicService';
import { CreateTopicBody, TopicDetail } from '../../schemas/topicSchema';

export class CreateTopicCommand extends BaseCommand<
    CreateTopicBody,
    RetrieveOneSchema<TopicDetail>
> {
    constructor(private readonly svc: TopicService) {
        super();
    }
    protected async executeBusinessLogic(input: CreateTopicBody) {
        const item = await this.svc.create(input);
        return new RetrieveOneSchema(item, 'Topic created', true);
    }
}
