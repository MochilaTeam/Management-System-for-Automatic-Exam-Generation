import { CalculateExamGradeCommand } from '../../../domains/exam-application/application/commands/calculateExamGradeCommand';
import { CreateExamAssignmentCommand } from '../../../domains/exam-application/application/commands/createExamAssignmentCommand';
import { ListEvaluatorExamsQuery } from '../../../domains/exam-application/application/queries/listEvaluatorExamsQuery';
import { ListStudentExamsQuery } from '../../../domains/exam-application/application/queries/listStudentExamsQuery';
import { ExamAssignmentService } from '../../../domains/exam-application/domain/services/examAssigmentService';
import ExamAssignments from '../../../infrastructure/exam-application/models/ExamAssignment';
import ExamRegrade from '../../../infrastructure/exam-application/models/ExamRegrade';
import { ExamAssignmentRepository } from '../../../infrastructure/exam-application/repositories/ExamAssignmentRepository';
import { ExamResponseRepository } from '../../../infrastructure/exam-application/repositories/ExamResponseRepository';
import { ExamRegradeRepository } from '../../../infrastructure/exam-application/repositories/ExamRegradeRepository';
import Exam from '../../../infrastructure/exam-generation/models/Exam';
import { ExamRepository } from '../../../infrastructure/exam-generation/repositories/ExamRepository';
import { TeacherSubjectLinkRepository } from '../../../infrastructure/question-bank/repositories/teacherSubjectLinkRepository';
import { Student, Teacher } from '../../../infrastructure/user/models';
import { StudentRepository } from '../../../infrastructure/user/repositories/StudentRepository';
import { TeacherRepository } from '../../../infrastructure/user/repositories/TeacherRepository';
import { RequestExamRegradeCommand } from '../../../domains/exam-application/application/commands/requestExamRegradeCommand';
import { makeExamQuestionRepository } from './examDependencies';
import { SendExamToEvaluatorCommand } from '../../../domains/exam-application/application/commands/sendExamToEvaluatorCommand';

let _repo: ExamAssignmentRepository | null = null;
let _examRegradeRepo: ExamRegradeRepository | null = null;
let _svc: ExamAssignmentService | null = null;
let _createCmd: CreateExamAssignmentCommand | null = null;
let _sendExamToEvaluatorCmd: SendExamToEvaluatorCommand | null = null;
let _listStudentExamsQuery: ListStudentExamsQuery | null = null;
let _listEvaluatorExamsQuery: ListEvaluatorExamsQuery | null = null;
let _requestExamRegradeCmd: RequestExamRegradeCommand | null = null;
let _calculateExamGradeCmd: CalculateExamGradeCommand | null = null;

// Repository
export function makeExamAssignmentRepository() {
    if (_repo) return _repo;
    _repo = new ExamAssignmentRepository(ExamAssignments);
    return _repo;
}

export function makeExamRegradeRepository() {
    if (_examRegradeRepo) return _examRegradeRepo;
    _examRegradeRepo = new ExamRegradeRepository(ExamRegrade);
    return _examRegradeRepo;
}

// Service
export function makeExamAssignmentService() {
    if (_svc) return _svc;

    const examAssignmentRepo = makeExamAssignmentRepository();
    const teacherRepo = new TeacherRepository(Teacher);
    const teacherSubjectLinkRepo = new TeacherSubjectLinkRepository();
    const studentRepo = new StudentRepository(Student);
    const examRepo = new ExamRepository(Exam);
    const examResponseRepo = new ExamResponseRepository();
    const examRegradeRepo = makeExamRegradeRepository();
    const examQuestionRepo = makeExamQuestionRepository();

    _svc = new ExamAssignmentService({
        examAssignmentRepo,
        examRepo,
        teacherRepo,
        teacherSubjectLinkRepo,
        studentRepo,
        examResponseRepo,
        examRegradeRepo,
        examQuestionRepo,
    });
    return _svc;
}

// Commands
export function makeCreateExamAssignmentCommand() {
    if (_createCmd) return _createCmd;
    _createCmd = new CreateExamAssignmentCommand(makeExamAssignmentService());
    return _createCmd;
}

export function makeSendExamToEvaluatorCommand() {
    if (_sendExamToEvaluatorCmd) return _sendExamToEvaluatorCmd;
    _sendExamToEvaluatorCmd = new SendExamToEvaluatorCommand(makeExamAssignmentService());
    return _sendExamToEvaluatorCmd;
}

export function makeRequestExamRegradeCommand() {
    if (_requestExamRegradeCmd) return _requestExamRegradeCmd;
    _requestExamRegradeCmd = new RequestExamRegradeCommand(makeExamAssignmentService());
    return _requestExamRegradeCmd;
}

export function makeCalculateExamGradeCommand() {
    if (_calculateExamGradeCmd) return _calculateExamGradeCmd;
    _calculateExamGradeCmd = new CalculateExamGradeCommand(makeExamAssignmentService());
    return _calculateExamGradeCmd;
}

// Queries
export function makeListStudentExamsQuery() {
    if (_listStudentExamsQuery) return _listStudentExamsQuery;
    _listStudentExamsQuery = new ListStudentExamsQuery(makeExamAssignmentService());
    return _listStudentExamsQuery;
}

export function makeListEvaluatorExamsQuery() {
    if (_listEvaluatorExamsQuery) return _listEvaluatorExamsQuery;
    _listEvaluatorExamsQuery = new ListEvaluatorExamsQuery(makeExamAssignmentService());
    return _listEvaluatorExamsQuery;
}
