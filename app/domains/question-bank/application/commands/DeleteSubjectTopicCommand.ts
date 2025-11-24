import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { TopicService } from '../../domain/services/topicService';
import { CreateSubjectTopicBody } from '../../schemas/subjectTopicSchema';

export class DeleteSubjectTopicCommand extends BaseCommand<CreateSubjectTopicBody, void> {
    constructor(private readonly svc: TopicService) {
        super();
    }
    protected async executeBusinessLogic(input: CreateSubjectTopicBody) {
        const deleted = await this.svc.deleteSubjectTopic(input);
        if (!deleted) throw new NotFoundError({ message: 'SUBJECT_TOPIC_NOT_FOUND' });
    }
}
