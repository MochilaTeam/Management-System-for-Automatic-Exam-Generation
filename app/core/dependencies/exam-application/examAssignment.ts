import { CreateExamAssignmentCommand } from '../../../domains/exam-application/application/commands/createExamAssignmentCommand';
import { ListStudentExamsQuery } from '../../../domains/exam-application/application/queries/listStudentExamsQuery';
import {
    ExamAssignmentService,
    IExamRepository,
} from '../../../domains/exam-application/domain/services/examAssigmentService';
import ExamAssignments from '../../../infrastructure/exam-application/models/ExamAssignment';
import { ExamAssignmentRepository } from '../../../infrastructure/exam-application/repositories/ExamAssignmentRepository';
import { TeacherSubjectLinkRepository } from '../../../infrastructure/question-bank/repositories/teacherSubjectLinkRepository';
import { Student, Teacher } from '../../../infrastructure/user/models';
import { StudentRepository } from '../../../infrastructure/user/repositories/StudentRepository';
import { TeacherRepository } from '../../../infrastructure/user/repositories/TeacherRepository';

let _repo: ExamAssignmentRepository | null = null;
let _svc: ExamAssignmentService | null = null;
let _createCmd: CreateExamAssignmentCommand | null = null;
let _listStudentExamsQuery: ListStudentExamsQuery | null = null;

const notImplementedExamRepository: IExamRepository = {
    //TODO: USAR EL REAL
    async getExamStatus(_examId) {
        throw new Error('ExamRepository not implemented');
    },
    async getExamSubjectId(_examId) {
        throw new Error('ExamRepository not implemented');
    },
    async updateExamStatus(_examId, _status) {
        throw new Error('ExamRepository not implemented');
    },
};

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

    _svc = new ExamAssignmentService({
        examAssignmentRepo,
        examRepo: notImplementedExamRepository,
        teacherRepo,
        teacherSubjectLinkRepo,
        studentRepo,
    });
    return _svc;
}

// Commands
export function makeCreateExamAssignmentCommand() {
    if (_createCmd) return _createCmd;
    _createCmd = new CreateExamAssignmentCommand(makeExamAssignmentService());
    return _createCmd;
}

// Queries
export function makeListStudentExamsQuery() {
    if (_listStudentExamsQuery) return _listStudentExamsQuery;
    _listStudentExamsQuery = new ListStudentExamsQuery(makeExamAssignmentService());
    return _listStudentExamsQuery;
}
