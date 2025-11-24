import { CreateSubjectTopicCommand } from '../../../domains/question-bank/application/commands/CreateSubjectTopicCommand';
import { CreateTopicCommand } from '../../../domains/question-bank/application/commands/CreateTopicCommand';
import { DeleteSubjectTopicCommand } from '../../../domains/question-bank/application/commands/DeleteSubjectTopicCommand';
import { DeleteTopicCommand } from '../../../domains/question-bank/application/commands/DeleteTopicCommand';
import { UpdateTopicCommand } from '../../../domains/question-bank/application/commands/UpdateTopicCommand';
import { GetTopicByIdQuery } from '../../../domains/question-bank/application/queries/GetTopicByIdQuery';
import { ListTopicsQuery } from '../../../domains/question-bank/application/queries/ListTopicsQuery';
import { TopicService } from '../../../domains/question-bank/domain/services/topicService';
import { Subject, Topic } from '../../../infrastructure/question-bank/models';
import { SubjectRepository } from '../../../infrastructure/question-bank/repositories/subjectRepository';
import { TopicRepository } from '../../../infrastructure/question-bank/repositories/topicRepository';

function getTopicRepo() {
    return new TopicRepository(Topic);
}
function getSubjectRepo() {
    return new SubjectRepository(Subject);
}
function getService() {
    return new TopicService({ repo: getTopicRepo(), subjectRepo: getSubjectRepo() });
}

export const makeCreateTopicCommand = () => new CreateTopicCommand(getService());
export const makeCreateSubjectTopicCommand = () => new CreateSubjectTopicCommand(getService());
export const makeDeleteSubjectTopicCommand = () => new DeleteSubjectTopicCommand(getService());
export const makeUpdateTopicCommand = () => new UpdateTopicCommand(getService());
export const makeDeleteTopicCommand = () => new DeleteTopicCommand(getService());
export const makeGetTopicByIdQuery = () => new GetTopicByIdQuery(getService());
export const makeListTopicsQuery = () => new ListTopicsQuery(getService());
