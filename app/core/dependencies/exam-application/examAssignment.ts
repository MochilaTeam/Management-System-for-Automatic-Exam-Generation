import { CreateExamAssignmentCommand } from '../../../domains/exam-application/application/commands/createExamAssignmentCommand';
import {
    ExamAssignmentService,
    IExamRepository,
} from '../../../domains/exam-application/domain/services/examAssigmentService';
import { ExamAssignmentRepository } from '../../../infrastructure/exam-application/repositories/ExamAssignmentRepository';
import ExamAssignments from '../../../infrastructure/exam-application/models/ExamAssignment';
import { TeacherSubjectLinkRepository } from '../../../infrastructure/question-bank/repositories/teacherSubjectLinkRepository';
import { Student, Teacher } from '../../../infrastructure/user/models';
import { StudentRepository } from '../../../infrastructure/user/repositories/StudentRepository';
import { TeacherRepository } from '../../../infrastructure/user/repositories/TeacherRepository';

let _svc: ExamAssignmentService | null = null;
let _createCmd: CreateExamAssignmentCommand | null = null;

const notImplementedExamRepository: IExamRepository = { //TODO: USAR EL REAL
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

function makeExamAssignmentService() {
    if (_svc) return _svc;

    const examAssignmentRepo = new ExamAssignmentRepository(ExamAssignments);
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

export function makeCreateExamAssignmentCommand() {
    if (_createCmd) return _createCmd;
    _createCmd = new CreateExamAssignmentCommand(makeExamAssignmentService());
    return _createCmd;
}
