import { CreateAutomaticExamCommand } from '../../../domains/exam-application/application/commands/CreateAutomaticExamCommand';
import { CreateManualExamCommand } from '../../../domains/exam-application/application/commands/CreateManualExamCommand';
import { DeleteExamCommand } from '../../../domains/exam-application/application/commands/DeleteExamCommand';
import { UpdateExamCommand } from '../../../domains/exam-application/application/commands/UpdateExamCommand';
import { GetExamByIdQuery } from '../../../domains/exam-application/application/queries/GetExamByIdQuery';
import { ListExamsQuery } from '../../../domains/exam-application/application/queries/ListExamsQuery';
import { ExamService } from '../../../domains/exam-application/domain/services/examService';
import Exam from '../../../infrastructure/exam-generation/models/Exam';
import ExamQuestion from '../../../infrastructure/exam-generation/models/ExamQuestion';
import { ExamQuestionRepository } from '../../../infrastructure/exam-generation/repositories/ExamQuestionRepository';
import { ExamRepository } from '../../../infrastructure/exam-generation/repositories/ExamRepository';
import Question from '../../../infrastructure/question-bank/models/Question';
import { QuestionRepository } from '../../../infrastructure/question-bank/repositories/QuestionRepository';

let _examRepo: ExamRepository | null = null;
let _examQuestionRepo: ExamQuestionRepository | null = null;
let _questionRepo: QuestionRepository | null = null;
let _svc: ExamService | null = null;

let _qList: ListExamsQuery | null = null;
let _qGetById: GetExamByIdQuery | null = null;

let _cCreateManual: CreateManualExamCommand | null = null;
let _cCreateAutomatic: CreateAutomaticExamCommand | null = null;
let _cUpdate: UpdateExamCommand | null = null;
let _cDelete: DeleteExamCommand | null = null;

export function makeExamRepository() {
    if (_examRepo) return _examRepo;
    _examRepo = new ExamRepository(Exam);
    return _examRepo;
}

export function makeExamQuestionRepository() {
    if (_examQuestionRepo) return _examQuestionRepo;
    _examQuestionRepo = new ExamQuestionRepository(ExamQuestion);
    return _examQuestionRepo;
}

export function makeQuestionRepository() {
    if (_questionRepo) return _questionRepo;
    _questionRepo = new QuestionRepository(Question);
    return _questionRepo;
}

export function makeExamService() {
    if (_svc) return _svc;
    _svc = new ExamService({
        examRepo: makeExamRepository(),
        examQuestionRepo: makeExamQuestionRepository(),
        questionRepo: makeQuestionRepository(),
    });
    return _svc;
}

export function makeListExamsQuery() {
    if (_qList) return _qList;
    _qList = new ListExamsQuery(makeExamService());
    return _qList;
}

export function makeGetExamByIdQuery() {
    if (_qGetById) return _qGetById;
    _qGetById = new GetExamByIdQuery(makeExamService());
    return _qGetById;
}

export function makeCreateManualExamCommand() {
    if (_cCreateManual) return _cCreateManual;
    _cCreateManual = new CreateManualExamCommand(makeExamService());
    return _cCreateManual;
}

export function makeCreateAutomaticExamCommand() {
    if (_cCreateAutomatic) return _cCreateAutomatic;
    _cCreateAutomatic = new CreateAutomaticExamCommand(makeExamService());
    return _cCreateAutomatic;
}

export function makeUpdateExamCommand() {
    if (_cUpdate) return _cUpdate;
    _cUpdate = new UpdateExamCommand(makeExamService());
    return _cUpdate;
}

export function makeDeleteExamCommand() {
    if (_cDelete) return _cDelete;
    _cDelete = new DeleteExamCommand(makeExamService());
    return _cDelete;
}
