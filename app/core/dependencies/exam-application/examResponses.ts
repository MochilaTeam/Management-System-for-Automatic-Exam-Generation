import { makeExamAssignmentRepository } from './examAssignment';
import { makeExamQuestionRepository } from './examDependencies';
import { CreateExamResponseCommand } from '../../../domains/exam-application/application/commands/createExamResponseCommand';
import { UpdateExamResponseCommand } from '../../../domains/exam-application/application/commands/updateExamResponseCommand';
import { GetExamResponseByIndexQuery } from '../../../domains/exam-application/application/queries/getExamResponseByIndexQuery';
import { ExamResponseService } from '../../../domains/exam-application/domain/services/examResponseService';
import { ExamResponseRepository } from '../../../infrastructure/exam-application/repositories/ExamResponseRepository';
import { Student } from '../../../infrastructure/user/models';
import { StudentRepository } from '../../../infrastructure/user/repositories/StudentRepository';
import { makeQuestionRepository } from '../question-bank/questionDependencies';

let _repo: ExamResponseRepository | null = null;
let _svc: ExamResponseService | null = null;
let _createCmd: CreateExamResponseCommand | null = null;
let _updateCmd: UpdateExamResponseCommand | null = null;
let _getByIndexQuery: GetExamResponseByIndexQuery | null = null;

// Repository
export function makeExamResponseRepository() {
    if (_repo) return _repo;
    _repo = new ExamResponseRepository();
    return _repo;
}

// Service
export function makeExamResponseService() {
    if (_svc) return _svc;

    const examResponseRepo = makeExamResponseRepository();
    const examAssignmentRepo = makeExamAssignmentRepository();
    const questionRepo = makeQuestionRepository();
    const examQuestionRepo = makeExamQuestionRepository();
    const studentRepo = new StudentRepository(Student);

    _svc = new ExamResponseService({
        examResponseRepo,
        examAssignmentRepo,
        questionRepo,
        studentRepo,
        examQuestionRepo,
    });
    return _svc;
}

// Commands
export function makeCreateExamResponseCommand() {
    if (_createCmd) return _createCmd;
    _createCmd = new CreateExamResponseCommand(makeExamResponseService());
    return _createCmd;
}

export function makeUpdateExamResponseCommand() {
    if (_updateCmd) return _updateCmd;
    _updateCmd = new UpdateExamResponseCommand(makeExamResponseService());
    return _updateCmd;
}

export function makeGetExamResponseByIndexQuery() {
    if (_getByIndexQuery) return _getByIndexQuery;
    _getByIndexQuery = new GetExamResponseByIndexQuery(makeExamResponseService());
    return _getByIndexQuery;
}
