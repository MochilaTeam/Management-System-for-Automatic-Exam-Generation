import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { TopicService } from '../../domain/services/topicService';
import { CreateSubjectTopicBody } from '../../schemas/subjectTopicSchema';
import { TopicDetail } from '../../schemas/topicSchema';

export class CreateSubjectTopicCommand extends BaseCommand<
    CreateSubjectTopicBody,
    RetrieveOneSchema<TopicDetail>
> {
    constructor(private readonly svc: TopicService) {
        super();
    }
    protected async executeBusinessLogic(input: CreateSubjectTopicBody) {
        const item = await this.svc.createSubjectTopic(input);
        return new RetrieveOneSchema(item, 'SubjectTopic created', true);
    }
}
