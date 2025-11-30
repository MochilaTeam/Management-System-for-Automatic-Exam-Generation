import { CreateExamAssignmentCommand } from '../../../domains/exam-application/application/commands/createExamAssignmentCommand';
import { SendExamToEvaluatorCommand } from '../../../domains/exam-application/application/commands/sendExamToEvaluatorCommand';
import { ListEvaluatorExamsQuery } from '../../../domains/exam-application/application/queries/listEvaluatorExamsQuery';
import { ListStudentExamsQuery } from '../../../domains/exam-application/application/queries/listStudentExamsQuery';
import { ExamAssignmentService } from '../../../domains/exam-application/domain/services/examAssigmentService';
import ExamAssignments from '../../../infrastructure/exam-application/models/ExamAssignment';
import { ExamAssignmentRepository } from '../../../infrastructure/exam-application/repositories/ExamAssignmentRepository';
import { ExamResponseRepository } from '../../../infrastructure/exam-application/repositories/ExamResponseRepository';
import Exam from '../../../infrastructure/exam-generation/models/Exam';
import { ExamRepository } from '../../../infrastructure/exam-generation/repositories/ExamRepository';
import { TeacherSubjectLinkRepository } from '../../../infrastructure/question-bank/repositories/teacherSubjectLinkRepository';
import { Student, Teacher } from '../../../infrastructure/user/models';
import { StudentRepository } from '../../../infrastructure/user/repositories/StudentRepository';
import { TeacherRepository } from '../../../infrastructure/user/repositories/TeacherRepository';

let _repo: ExamAssignmentRepository | null = null;
let _svc: ExamAssignmentService | null = null;
let _createCmd: CreateExamAssignmentCommand | null = null;
let _sendExamToEvaluatorCmd: SendExamToEvaluatorCommand | null = null;
let _listStudentExamsQuery: ListStudentExamsQuery | null = null;
let _listEvaluatorExamsQuery: ListEvaluatorExamsQuery | null = null;

// Repository
export function makeExamAssignmentRepository() {
    if (_repo) return _repo;
    _repo = new ExamAssignmentRepository(ExamAssignments);
    return _repo;
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

    _svc = new ExamAssignmentService({
        examAssignmentRepo,
        examRepo,
        teacherRepo,
        teacherSubjectLinkRepo,
        studentRepo,
        examResponseRepo,
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
