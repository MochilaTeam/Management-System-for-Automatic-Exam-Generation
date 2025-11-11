import { CreateTopicCommand } from '../../../domains/question-bank/application/commands/CreateTopicCommand';
import { DeleteTopicCommand } from '../../../domains/question-bank/application/commands/DeleteTopicCommand';
import { UpdateTopicCommand } from '../../../domains/question-bank/application/commands/UpdateTopicCommand';
import { GetTopicByIdQuery } from '../../../domains/question-bank/application/queries/GetTopicByIdQuery';
import { ListTopicsQuery } from '../../../domains/question-bank/application/queries/ListTopicsQuery';
import { TopicService } from '../../../domains/question-bank/domain/services/topicService';
import { Topic } from '../../../infrastructure/question-bank/models';
import { TopicRepository } from '../../../infrastructure/question-bank/repositories/topicRepository';

function getRepo() {
    return new TopicRepository(Topic);
}
function getService() {
    return new TopicService(getRepo());
}

export const makeCreateTopicCommand = () => new CreateTopicCommand(getService());
export const makeUpdateTopicCommand = () => new UpdateTopicCommand(getService());
export const makeDeleteTopicCommand = () => new DeleteTopicCommand(getService());
export const makeGetTopicByIdQuery = () => new GetTopicByIdQuery(getService());
export const makeListTopicsQuery = () => new ListTopicsQuery(getService());
