import { CreateExamResponseCommand } from "../../../domains/exam-application/application/commands/createExamResponseCommand";
import { ExamResponseService } from "../../../domains/exam-application/domain/services/examResponseService";
import { ExamResponseRepository } from "../../../infrastructure/exam-application/repositories/ExamResponseRepository";
import { Student } from "../../../infrastructure/user/models";
import { StudentRepository } from "../../../infrastructure/user/repositories/StudentRepository";
import { makeQuestionRepository } from "../question-bank/questionDependencies";
import { makeExamAssignmentRepository } from "./examAssignment";

let _repo: ExamResponseRepository | null = null;
let _svc: ExamResponseService | null = null;
let _createCmd: CreateExamResponseCommand | null = null;

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
    const studentRepo = new StudentRepository(Student);

    _svc = new ExamResponseService({
        examResponseRepo,
        examAssignmentRepo,
        questionRepo,
        studentRepo,
    });
    return _svc;
}

// Commands
export function makeCreateExamResponseCommand() {
    if (_createCmd) return _createCmd;
    _createCmd = new CreateExamResponseCommand(makeExamResponseService());
    return _createCmd;
}