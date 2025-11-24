import { CreateSubjectCommand } from '../../../domains/question-bank/application/commands/CreateSubjectCommand';
import { DeleteSubjectCommand } from '../../../domains/question-bank/application/commands/DeleteSubjectCommand';
import { UpdateSubjectCommand } from '../../../domains/question-bank/application/commands/UpdateSubjectCommand';
import { GetSubjectByIdQuery } from '../../../domains/question-bank/application/queries/GetSubjectByIdQuery';
import { ListSubjectsQuery } from '../../../domains/question-bank/application/queries/ListSubjectsQuery';
import { SubjectService } from '../../../domains/question-bank/domain/services/subjectService';
import { Subject } from '../../../infrastructure/question-bank/models/';
import { SubjectRepository } from '../../../infrastructure/question-bank/repositories/subjectRepository';

function getRepo() {
    return new SubjectRepository(Subject);
}
function getService() {
    return new SubjectService({ repo: getRepo() });
}

export const makeCreateSubjectCommand = () => new CreateSubjectCommand(getService());
export const makeUpdateSubjectCommand = () => new UpdateSubjectCommand(getService());
export const makeDeleteSubjectCommand = () => new DeleteSubjectCommand(getService());
export const makeGetSubjectByIdQuery = () => new GetSubjectByIdQuery(getService());
export const makeListSubjectsQuery = () => new ListSubjectsQuery(getService());
