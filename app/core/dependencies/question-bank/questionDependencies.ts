import { CreateQuestionCommand } from '../../../domains/question-bank/application/commands/CreateQuestionCommand';
import { DeleteQuestionCommand } from '../../../domains/question-bank/application/commands/DeleteQuestionCommand';
import { UpdateQuestionCommand } from '../../../domains/question-bank/application/commands/UpdateQuestionCommand';
import { GetQuestionByIdQuery } from '../../../domains/question-bank/application/queries/GetQuestionByIdQuery';
import { ListQuestionsQuery } from '../../../domains/question-bank/application/queries/ListQuestionsQuery';
import { QuestionService } from '../../../domains/question-bank/domain/services/questionService';
import { Subject, SubTopic } from '../../../infrastructure/question-bank/models';
import QuestionModel from '../../../infrastructure/question-bank/models/Question';
import { QuestionRepository } from '../../../infrastructure/question-bank/repositories/QuestionRepository';
import { SubjectRepository } from '../../../infrastructure/question-bank/repositories/subjectRepository';
import { SubtopicRepository } from '../../../infrastructure/question-bank/repositories/subtopicRepository';

function getQuestionRepo() {
    return new QuestionRepository(QuestionModel);
}

function getSubtopicRepo() {
    return new SubtopicRepository(SubTopic);
}

function getSubjectRepo() {
    return new SubjectRepository(Subject);
}

function getService() {
    return new QuestionService({
        questionRepo: getQuestionRepo(),
        subtopicRepo: getSubtopicRepo(),
        subjectRepo: getSubjectRepo(),
    });
}

export const makeCreateQuestionCommand = () => new CreateQuestionCommand(getService());
export const makeUpdateQuestionCommand = () => new UpdateQuestionCommand(getService());
export const makeDeleteQuestionCommand = () => new DeleteQuestionCommand(getService());
export const makeGetQuestionByIdQuery = () => new GetQuestionByIdQuery(getService());
export const makeListQuestionsQuery = () => new ListQuestionsQuery(getService());

