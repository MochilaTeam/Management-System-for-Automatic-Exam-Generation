import { SubtopicService } from "../../../domains/question-bank/domain/services/subtopicService";
import { CreateSubtopicCommand } from "../../../domains/question-bank/application/commands/CreateSubtopicCommand";
import { DeleteSubtopicCommand } from "../../../domains/question-bank/application/commands/DeleteSubtopicCommand";
import { GetSubtopicByIdQuery } from "../../../domains/question-bank/application/queries/GetSubtopicByIdQuery";
import { ListSubtopicsQuery } from "../../../domains/question-bank/application/queries/ListSubtopicsQuery";

import { SubtopicRepository } from "../../../infrastructure/question-bank/repositories/subtopicRepository";
import { SubTopic } from "../../../infrastructure/question-bank/models";

function getRepo() { return new SubtopicRepository(SubTopic); }
function getService() { return new SubtopicService(getRepo()); }

export const makeCreateSubtopicCommand = () => new CreateSubtopicCommand(getService());
export const makeDeleteSubtopicCommand = () => new DeleteSubtopicCommand(getService());
export const makeGetSubtopicByIdQuery = () => new GetSubtopicByIdQuery(getService());
export const makeListSubtopicsQuery = () => new ListSubtopicsQuery(getService());
