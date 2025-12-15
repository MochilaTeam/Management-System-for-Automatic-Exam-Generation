import { makeExamAssignmentRepository, makeExamRegradeRepository } from './examAssignment';
import { makeExamQuestionRepository } from './examDependencies';
import { CreateExamResponseCommand } from '../../../domains/exam-application/application/commands/createExamResponseCommand';
import { UpdateExamResponseCommand } from '../../../domains/exam-application/application/commands/updateExamResponseCommand';
import { UpdateManualPointsCommand } from '../../../domains/exam-application/application/commands/updateManualPointsCommand';
import { GetExamQuestionDetailQuery } from '../../../domains/exam-application/application/queries/getExamQuestionDetailQuery';
import { GetExamResponseByIndexQuery } from '../../../domains/exam-application/application/queries/getExamResponseByIndexQuery';
import { ExamResponseService } from '../../../domains/exam-application/domain/services/examResponseService';
import { ExamResponseRepository } from '../../../infrastructure/exam-application/repositories/ExamResponseRepository';
import { TeacherSubjectLinkRepository } from '../../../infrastructure/question-bank/repositories/teacherSubjectLinkRepository';
import { Student, Teacher } from '../../../infrastructure/user/models';
import { StudentRepository } from '../../../infrastructure/user/repositories/StudentRepository';
import { TeacherRepository } from '../../../infrastructure/user/repositories/TeacherRepository';
import { makeQuestionRepository } from '../question-bank/questionDependencies';

let _repo: ExamResponseRepository | null = null;
let _svc: ExamResponseService | null = null;
let _createCmd: CreateExamResponseCommand | null = null;
let _updateCmd: UpdateExamResponseCommand | null = null;
let _updateManualPointsCmd: UpdateManualPointsCommand | null = null;
let _getByIndexQuery: GetExamResponseByIndexQuery | null = null;
let _getQuestionDetailQuery: GetExamQuestionDetailQuery | null = null;

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
    const examRegradeRepo = makeExamRegradeRepository();
    const questionRepo = makeQuestionRepository();
    const examQuestionRepo = makeExamQuestionRepository();
    const studentRepo = new StudentRepository(Student);
    const teacherRepo = new TeacherRepository(Teacher);
    const teacherSubjectLinkRepo = new TeacherSubjectLinkRepository();

    _svc = new ExamResponseService({
        examResponseRepo,
        examAssignmentRepo,
        examRegradeRepo,
        questionRepo,
        studentRepo,
        examQuestionRepo,
        teacherRepo,
        teacherSubjectLinkRepo,
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

export function makeUpdateManualPointsCommand() {
    if (_updateManualPointsCmd) return _updateManualPointsCmd;
    _updateManualPointsCmd = new UpdateManualPointsCommand(makeExamResponseService());
    return _updateManualPointsCmd;
}

export function makeGetExamResponseByIndexQuery() {
    if (_getByIndexQuery) return _getByIndexQuery;
    _getByIndexQuery = new GetExamResponseByIndexQuery(makeExamResponseService());
    return _getByIndexQuery;
}

export function makeGetExamQuestionDetailQuery() {
    if (_getQuestionDetailQuery) return _getQuestionDetailQuery;
    _getQuestionDetailQuery = new GetExamQuestionDetailQuery(makeExamResponseService());
    return _getQuestionDetailQuery;
}
