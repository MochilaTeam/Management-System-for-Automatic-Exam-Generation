import { BaseDomainService } from '../../../../shared/domain/base_service';
import { IExamQuestionRepository } from '../../../exam-generation/domain/ports/IExamQuestionRepository';
import { IExamRepository } from '../../../exam-generation/domain/ports/IExamRepository';
import { IStudentRepository } from '../../../user/domain/ports/IStudentRepository';
import { ITeacherRepository } from '../../../user/domain/ports/ITeacherRepository';
import { ITeacherSubjectLinkRepository } from '../../../user/domain/ports/ITeacherSubjectLinkRepository';
import { StudentRead } from '../../../user/schemas/studentSchema';
import { AssignedExamStatus } from '../../entities/enums/AssignedExamStatus';
import { ExamRegradesStatus } from '../../entities/enums/ExamRegradeStatus';
import { ExamStatusEnum } from '../../entities/enums/ExamStatusEnum';
import {
    AssignExamToCourseResponse,
    CalculateExamGradeCommandSchema,
    CalculateExamGradeResult,
    ListEvaluatorExamsQuery,
    SendExamToEvaluatorCommandSchema,
    StudentExamAssignmentItem,
} from '../../schemas/examAssignmentSchema';
import {
    ExamRegradeOutput,
    ListPendingExamRegradesQuery,
    PendingExamRegradeItem,
    RequestExamRegradeCommandSchema,
    ResolveExamRegradeCommandSchema,
} from '../../schemas/examRegradeSchema';
import type {
    ExamAssignmentStatusSnapshot,
    IExamAssignmentRepository,
} from '../ports/IExamAssignmentRepository';
import type { IExamRegradeRepository } from '../ports/IExamRegradeRepository';
import type { IExamResponseRepository } from '../ports/IExamResponseRepository';

type Deps = {
    examAssignmentRepo: IExamAssignmentRepository;
    examRepo: IExamRepository;
    teacherRepo: ITeacherRepository;
    teacherSubjectLinkRepo: ITeacherSubjectLinkRepository;
    studentRepo: IStudentRepository;
    examResponseRepo: IExamResponseRepository;
    examRegradeRepo: IExamRegradeRepository;
    examQuestionRepo: IExamQuestionRepository;
};

export class ExamAssignmentService extends BaseDomainService {
    private readonly examAssignmentRepo: IExamAssignmentRepository;
    private readonly examRepo: IExamRepository;
    private readonly teacherRepo: ITeacherRepository;
    private readonly teacherSubjectLinkRepo: ITeacherSubjectLinkRepository;
    private readonly studentRepo: IStudentRepository;
    private readonly examResponseRepo: IExamResponseRepository;
    private readonly examRegradeRepo: IExamRegradeRepository;
    private readonly examQuestionRepo: IExamQuestionRepository;

    constructor({
        examAssignmentRepo,
        examRepo,
        teacherRepo,
        teacherSubjectLinkRepo,
        studentRepo,
        examResponseRepo,
        examRegradeRepo,
        examQuestionRepo,
    }: Deps) {
        super();
        this.examAssignmentRepo = examAssignmentRepo;
        this.examRepo = examRepo;
        this.teacherRepo = teacherRepo;
        this.teacherSubjectLinkRepo = teacherSubjectLinkRepo;
        this.studentRepo = studentRepo;
        this.examResponseRepo = examResponseRepo;
        this.examRegradeRepo = examRegradeRepo;
        this.examQuestionRepo = examQuestionRepo;
    }

    async createExamAssignment(
        examId: string,
        studentIds: string[],
        currentUserId: string,
        applicationDate: Date,
        durationMinutes: number,
    ): Promise<AssignExamToCourseResponse> {
        const operation = 'create-exam-assignment';
        this.logOperationStart(operation);
        try {
            //Validar que el examen existe y tiene estado APPROVED
            await this.ensureExamIsApproved(examId);

            //Validar que el profesor puede asignar el examen
            const teacherId = await this.ensureTeacherCanAssignExam(examId, currentUserId);

            //Validar estudiantes por id
            const uniqueStudentIds = [...new Set(studentIds)];
            const students = await this.getStudentsByIds(uniqueStudentIds);

            if (students.length === 0) {
                this.raiseBusinessRuleError(operation, 'NO SE ENCONTRARON ESTUDIANTES VALIDOS', {
                    entity: 'Student',
                });
            }

            const missingStudentIds = uniqueStudentIds.filter(
                (id) => !students.some((student) => student.id === id),
            );
            if (missingStudentIds.length > 0) {
                this.raiseBusinessRuleError(operation, 'ALGUNOS ESTUDIANTES NO EXISTEN', {
                    entity: 'Student',
                    details: { missingStudentIds },
                });
            }

            //Generar asignaciones para todos los estudiantes
            await this.createAssignmentsForStudents({
                examId,
                students,
                professorId: teacherId,
                applicationDate,
                durationMinutes,
            });

            //Cambiar el estado del examen
            await this.examRepo.update(examId, { examStatus: ExamStatusEnum.PUBLISHED });

            //Devolver la respuesta
            const result: AssignExamToCourseResponse = {
                examId,
                assignedStudentIds: students.map((student) => student.id),
                assignmentsCreated: students.length,
                applicationDate,
                durationMinutes,
                examStatus: ExamStatusEnum.PUBLISHED,
            };
            this.logOperationSuccess(operation);
            return result;
        } catch (error) {
            this.logOperationError(operation, error as Error);
            throw error;
        }
    }

    private async ensureTeacherCanAssignExam(
        examId: string,
        currentUserId: string,
    ): Promise<string> {
        const operation = 'ensure-teacher-can-assign-exam';

        const exam = await this.examRepo.get_by_id(examId);
        if (!exam) {
            this.raiseNotFoundError(operation, 'EXAMEN NO ENCONTRADO', { entity: 'Exam' });
        }
        const subjectId = exam?.subjectId;

        const teachers = await this.teacherRepo.list({
            filters: { userId: currentUserId },
            limit: 1,
            offset: 0,
        });
        const teacher = teachers[0];
        if (!teacher) {
            this.raiseBusinessRuleError(operation, 'PROFESOR NO ENCONTRADD', {
                entity: 'Teacher',
            });
        }

        const assignments = await this.teacherSubjectLinkRepo.getAssignments(teacher.id);
        console.log('assignments', assignments);
        const teachesSubject = assignments.teachingSubjectIds.includes(subjectId!);
        if (!teachesSubject) {
            this.raiseBusinessRuleError(operation, 'PROFESOR NO ASIGNADO A LA MATERIA', {
                entity: 'Subject',
            });
        }

        return teacher.id;
    }

    private async getStudentsByIds(studentIds: string[]): Promise<StudentRead[]> {
        if (studentIds.length === 0) {
            return [];
        }

        return this.studentRepo.list({
            filters: {
                studentIds,
            },
            limit: studentIds.length,
            offset: 0,
        });
    }

    private async createAssignmentsForStudents(params: {
        examId: string;
        students: StudentRead[];
        professorId: string;
        applicationDate: Date;
        durationMinutes: number;
    }): Promise<void> {
        const operation = 'create-assignments-for-students';

        // Create an assignment for each student
        const assignmentPromises = params.students.map((student) =>
            this.examAssignmentRepo.createExamAssignment({
                examId: params.examId,
                studentId: student.id,
                professorId: params.professorId,
                applicationDate: params.applicationDate,
                durationMinutes: params.durationMinutes,
            }),
        );

        try {
            await Promise.all(assignmentPromises);
        } catch (error) {
            this.logOperationError(operation, error as Error);
            throw error;
        }
    }

    private async ensureExamIsApproved(examId: string): Promise<void> {
        const operation = 'ensure-exam-is-approved';
        const exam = await this.examRepo.get_by_id(examId);
        if (!exam) {
            this.raiseNotFoundError(operation, 'EXAMEN NO ENCONTRADO', { entity: 'Exam' });
        }
        if (exam?.examStatus !== ExamStatusEnum.APPROVED) {
            this.raiseBusinessRuleError(operation, 'EXAMEN NO APROBADO AUN', {
                entity: 'Exam',
            });
        }
    }

    async listStudentExams(input: {
        currentUserId: string;
        page: number;
        limit: number;
        status?: AssignedExamStatus;
        subjectId?: string;
        teacherId?: string;
        examTitle?: string;
    }) {
        const operation = 'list-student-exams';
        this.logOperationStart(operation);

        try {
            // Get student from userId
            const students = await this.studentRepo.list({
                filters: { userId: input.currentUserId },
                limit: 1,
                offset: 0,
            });

            const student = students[0];
            if (!student) {
                this.raiseNotFoundError(operation, 'ESTUDIANTE NO ENCONTRADO', {
                    entity: 'Student',
                });
            }

            await this.refreshStudentAssignmentsStatuses(student.id);

            // Calculate offset from page
            const offset = (input.page - 1) * input.limit;

            // Call repository with filters
            const result = await this.examAssignmentRepo.listStudentExamAssignments({
                offset,
                limit: input.limit,
                filters: {
                    studentId: student.id,
                    status: input.status,
                    subjectId: input.subjectId,
                    teacherId: input.teacherId,
                    examTitle: input.examTitle,
                },
            });

            this.logOperationSuccess(operation);
            return result;
        } catch (error) {
            this.logOperationError(operation, error as Error);
            throw error;
        }
    }

    async sendExamToEvaluator(
        input: SendExamToEvaluatorCommandSchema,
    ): Promise<StudentExamAssignmentItem> {
        const operation = 'send-exam-to-evaluator';
        this.logOperationStart(operation);

        try {
            const student = await this.getStudentByUserId(input.currentUserId, operation);
            const assignment = await this.examAssignmentRepo.findByExamIdAndStudentId(
                input.examId,
                student.id,
            );

            if (!assignment) {
                this.raiseNotFoundError(operation, 'ASIGNACIÓN NO ENCONTRADA', {
                    entity: 'ExamAssignment',
                });
            }

            const allowedStatuses = [AssignedExamStatus.ENABLED, AssignedExamStatus.SUBMITTED];
            if (!allowedStatuses.includes(assignment.status)) {
                this.raiseBusinessRuleError(operation, 'EL EXAMEN NO ESTÁ LISTO PARA EVALUARSE', {
                    entity: 'ExamAssignment',
                });
            }

            await this.examAssignmentRepo.updateStatus(
                assignment.id,
                AssignedExamStatus.IN_EVALUATION,
            );

            const updated = await this.examAssignmentRepo.findDetailedById(assignment.id);
            if (!updated) {
                this.raiseNotFoundError(operation, 'ASIGNACIÓN NO ENCONTRADA', {
                    entity: 'ExamAssignment',
                });
            }

            this.logOperationSuccess(operation);
            return updated;
        } catch (error) {
            this.logOperationError(operation, error as Error);
            throw error;
        }
    }

    async listEvaluatorExams(input: ListEvaluatorExamsQuery) {
        const operation = 'list-evaluator-exams';
        this.logOperationStart(operation);

        try {
            const teacher = await this.getTeacherByUserId(input.currentUserId, operation);
            const offset = (input.page - 1) * input.limit;

            const result = await this.examAssignmentRepo.listStudentExamAssignments({
                offset,
                limit: input.limit,
                filters: {
                    teacherId: teacher.id,
                    status: AssignedExamStatus.IN_EVALUATION,
                },
            });

            this.logOperationSuccess(operation);
            return result;
        } catch (error) {
            this.logOperationError(operation, error as Error);
            throw error;
        }
    }

    async listPendingExamRegrades(
        input: ListPendingExamRegradesQuery,
    ): Promise<{ items: PendingExamRegradeItem[]; total: number }> {
        const operation = 'list-pending-exam-regrades';
        this.logOperationStart(operation);

        try {
            const teacher = await this.getTeacherByUserId(input.currentUserId, operation);
            const limit = input.limit ?? 10;
            const page = input.page ?? 1;
            const offset = (page - 1) * limit;

            const { items: regrades, total } = await this.examRegradeRepo.listPendingByProfessor({
                professorId: teacher.id,
                limit,
                offset,
            });

            const enriched: PendingExamRegradeItem[] = [];

            for (const regrade of regrades) {
                const assignment = await this.examAssignmentRepo.findByExamIdAndStudentId(
                    regrade.examId,
                    regrade.studentId,
                );
                if (!assignment) {
                    continue;
                }

                enriched.push({
                    ...assignment,
                    regradeId: regrade.id,
                    reason: regrade.reason,
                    requestedAt: regrade.requestedAt,
                    regradeStatus: regrade.status,
                });
            }

            this.logOperationSuccess(operation);
            return { items: enriched, total };
        } catch (error) {
            this.logOperationError(operation, error as Error);
            throw error;
        }
    }

    async calculateExamGrade(
        input: CalculateExamGradeCommandSchema,
    ): Promise<CalculateExamGradeResult> {
        const operation = 'calculate-exam-grade';
        this.logOperationStart(operation);

        try {
            const teacher = await this.getTeacherByUserId(input.currentUserId, operation);

            const assignment = await this.examAssignmentRepo.findDetailedById(input.assignmentId);
            if (!assignment) {
                this.raiseNotFoundError(operation, 'ASIGNACIÓN NO ENCONTRADA', {
                    entity: 'ExamAssignment',
                });
            }

            // Type guard to ensure assignment is not null (though findDetailedById check handles it, TS might complain)
            if (!assignment) throw new Error('Unreachable');

            if (assignment.teacherId !== teacher.id) {
                this.raiseBusinessRuleError(operation, 'NO ERES EL DOCENTE ASIGNADO', {
                    entity: 'ExamAssignment',
                });
            }

            const allowedStatuses = [
                AssignedExamStatus.IN_EVALUATION,
                AssignedExamStatus.SUBMITTED,
                AssignedExamStatus.GRADED,
                AssignedExamStatus.REGRADING,
                AssignedExamStatus.REGRADED,
            ];
            if (!allowedStatuses.includes(assignment.status)) {
                this.raiseBusinessRuleError(operation, 'EL EXAMEN AÚN NO PUEDE SER CALIFICADO', {
                    entity: 'ExamAssignment',
                });
            }

            const result = await this.recalculateAssignmentGrade(assignment, operation);

            this.logOperationSuccess(operation);
            return result;
        } catch (error) {
            this.logOperationError(operation, error as Error);
            throw error;
        }
    }

    async requestExamRegrade(input: RequestExamRegradeCommandSchema): Promise<ExamRegradeOutput> {
        const operation = 'request-exam-regrade';
        this.logOperationStart(operation);

        try {
            const student = await this.getStudentByUserId(input.currentUserId, operation);
            const assignment = await this.examAssignmentRepo.findByExamIdAndStudentId(
                input.examId,
                student.id,
            );

            if (!assignment) {
                this.raiseNotFoundError(operation, 'ASIGNACIÓN NO ENCONTRADA', {
                    entity: 'ExamAssignment',
                });
            }

            if (
                ![AssignedExamStatus.GRADED, AssignedExamStatus.REGRADED].includes(
                    assignment.status,
                )
            ) {
                this.raiseBusinessRuleError(operation, 'EL EXAMEN AÚN NO HA SIDO CALIFICADO', {
                    entity: 'ExamAssignment',
                });
            }

            const existing = await this.examRegradeRepo.findActiveByExamAndStudent(
                input.examId,
                student.id,
            );
            if (existing) {
                this.raiseBusinessRuleError(operation, 'YA EXISTE UNA SOLICITUD ACTIVA', {
                    entity: 'ExamRegrade',
                });
            }

            const teacher = await this.teacherRepo.get_by_id(input.professorId);
            if (!teacher) {
                this.raiseNotFoundError(operation, 'PROFESOR NO ENCONTRADO', {
                    entity: 'Teacher',
                });
            }

            console.log('ASSIGNMENT', assignment);
            await this.ensureTeacherCanReviewExam(operation, teacher.id, assignment.subjectId);

            const regrade = await this.examRegradeRepo.create({
                examId: input.examId,
                studentId: student.id,
                professorId: teacher.id,
                reason: input.reason ?? null,
                status: ExamRegradesStatus.REQUESTED,
                requestedAt: new Date(),
            });

            await this.examAssignmentRepo.updateStatus(assignment.id, AssignedExamStatus.REGRADING);

            this.logOperationSuccess(operation);
            return regrade;
        } catch (error) {
            this.logOperationError(operation, error as Error);
            throw error;
        }
    }

    async resolveExamRegrade(
        input: ResolveExamRegradeCommandSchema,
    ): Promise<CalculateExamGradeResult> {
        const operation = 'resolve-exam-regrade';
        this.logOperationStart(operation);

        try {
            const teacher = await this.getTeacherByUserId(input.currentUserId, operation);

            const regrade = await this.examRegradeRepo.findById(input.regradeId);
            if (!regrade) {
                this.raiseNotFoundError(operation, 'SOLICITUD NO ENCONTRADA', {
                    entity: 'ExamRegrade',
                });
            }

            if (regrade.professorId !== teacher.id) {
                this.raiseBusinessRuleError(operation, 'NO ERES EL DOCENTE ASIGNADO', {
                    entity: 'ExamRegrade',
                });
            }

            const assignment = await this.examAssignmentRepo.findByExamIdAndStudentId(
                regrade.examId,
                regrade.studentId,
            );
            if (!assignment) {
                this.raiseNotFoundError(operation, 'ASIGNACIÓN NO ENCONTRADA', {
                    entity: 'ExamAssignment',
                });
            }

            if (
                ![AssignedExamStatus.REGRADING, AssignedExamStatus.REGRADED].includes(
                    assignment.status,
                )
            ) {
                this.raiseBusinessRuleError(
                    operation,
                    'LA ASIGNACIÓN NO ESTÁ EN REVISIÓN DE NOTA',
                    {
                        entity: 'ExamAssignment',
                    },
                );
            }

            const activeStatuses = [ExamRegradesStatus.REQUESTED, ExamRegradesStatus.IN_REVIEW];
            if (!activeStatuses.includes(regrade.status)) {
                this.raiseBusinessRuleError(operation, 'LA SOLICITUD YA FUE RESUELTA', {
                    entity: 'ExamRegrade',
                });
            }

            const gradeResult = await this.recalculateAssignmentGrade(assignment, operation);

            await this.examRegradeRepo.resolve(regrade.id, {
                status: ExamRegradesStatus.RESOLVED,
                resolvedAt: new Date(),
                finalGrade: gradeResult.finalGrade,
            });

            this.logOperationSuccess(operation);

            return gradeResult;
        } catch (error) {
            this.logOperationError(operation, error as Error);
            throw error;
        }
    }

    private async ensureTeacherCanReviewExam(
        operation: string,
        teacherId: string,
        subjectId: string,
    ) {
        console.log('ENTROOOO AQUIII');
        console.log('TEACHER_ID', teacherId);
        console.log('SUBJECT_  ID', subjectId);

        const assignments = await this.teacherSubjectLinkRepo.getAssignments(teacherId);
        console.log('assignments', assignments);
        const canReview =
            assignments.teachingSubjectIds.includes(subjectId) ||
            assignments.leadSubjectIds.includes(subjectId);
        if (!canReview) {
            this.raiseBusinessRuleError(operation, 'PROFESOR NO ASIGNADO A LA MATERIA', {
                entity: 'Subject',
            });
        }
    }

    private async refreshStudentAssignmentsStatuses(studentId: string) {
        const snapshots = await this.examAssignmentRepo.listAssignmentsForStatusRefresh(studentId);
        if (!snapshots.length) return;

        const now = new Date();
        for (const snapshot of snapshots) {
            const newStatus = await this.calculateStatusForSnapshot(snapshot, now);
            if (newStatus && newStatus !== snapshot.status) {
                await this.examAssignmentRepo.updateStatus(snapshot.id, newStatus);

                if (newStatus === AssignedExamStatus.IN_EVALUATION) {
                    await this.ensureMissingResponsesHaveZeroScore(
                        snapshot.examId,
                        snapshot.studentId,
                    );
                }
            }
        }
    }

    private async ensureMissingResponsesHaveZeroScore(examId: string, studentId: string) {
        const questions = await this.examQuestionRepo.listByExamId(examId);
        if (!questions.length) return;

        const responses = await this.examResponseRepo.listByExamAndStudent(examId, studentId);
        const answeredQuestionIds = new Set(responses.map((resp) => resp.examQuestionId));

        const unanswered = questions.filter((question) => !answeredQuestionIds.has(question.id));
        if (!unanswered.length) return;

        const creationDate = new Date();

        await Promise.all(
            unanswered.map((question) =>
                this.examResponseRepo.create({
                    examId,
                    examQuestionId: question.id,
                    studentId,
                    selectedOptions: null,
                    textAnswer: null,
                    autoPoints: 0,
                    manualPoints: null,
                    answeredAt: creationDate,
                }),
            ),
        );
    }

    private async recalculateAssignmentGrade(
        assignment: StudentExamAssignmentItem,
        operation: string,
    ): Promise<CalculateExamGradeResult> {
        const examQuestions = await this.examQuestionRepo.listByExamId(assignment.examId);
        if (!examQuestions.length) {
            this.raiseBusinessRuleError(operation, 'EL EXAMEN NO TIENE PREGUNTAS CONFIGURADAS', {
                entity: 'Exam',
            });
        }

        const examTotalScoreRaw = examQuestions.reduce(
            (acc, question) => acc + Number(question.questionScore),
            0,
        );
        if (examTotalScoreRaw <= 0) {
            this.raiseBusinessRuleError(operation, 'LA NOTA TOTAL DEL EXAMEN ES INVÁLIDA', {
                entity: 'Exam',
            });
        }
        const examTotalScore = Number(examTotalScoreRaw.toFixed(2));

        const responses = await this.examResponseRepo.listByExamAndStudent(
            assignment.examId,
            assignment.studentId,
        );

        const ungradedResponse = responses.find(
            (resp) => resp.manualPoints === null && resp.autoPoints === null,
        );

        if (ungradedResponse) {
            this.raiseBusinessRuleError(operation, 'AÚN HAY PREGUNTAS SIN CALIFICAR', {
                entity: 'ExamResponse',
                details: { ungradedResponseId: ungradedResponse.id },
            });
        }

        const questionMap = new Map(examQuestions.map((question) => [question.id, question]));
        const obtainedScoreRaw = responses.reduce((acc, resp) => {
            const question = questionMap.get(resp.examQuestionId);
            if (!question) {
                return acc;
            }
            const awarded = resp.manualPoints ?? resp.autoPoints ?? 0;
            const normalized = Math.min(
                Math.max(Number(awarded), 0),
                Number(question.questionScore),
            );
            return acc + normalized;
        }, 0);

        const finalGrade = Number(Math.min(obtainedScoreRaw, examTotalScore).toFixed(2));

        const statusAfterGrade = [
            AssignedExamStatus.REGRADING,
            AssignedExamStatus.REGRADED,
        ].includes(assignment.status)
            ? AssignedExamStatus.REGRADED
            : AssignedExamStatus.GRADED;

        await this.examAssignmentRepo.updateGrade(assignment.id, {
            grade: finalGrade,
            status: statusAfterGrade,
        });

        return {
            assignmentId: assignment.id,
            examId: assignment.examId,
            studentId: assignment.studentId,
            finalGrade,
            examTotalScore,
        };
    }

    private async calculateStatusForSnapshot(
        snapshot: ExamAssignmentStatusSnapshot,
        now: Date,
    ): Promise<AssignedExamStatus | null> {
        if (!snapshot.applicationDate) {
            return snapshot.status;
        }

        if (
            snapshot.status === AssignedExamStatus.CANCELLED ||
            snapshot.status === AssignedExamStatus.GRADED ||
            snapshot.status === AssignedExamStatus.REGRADED ||
            snapshot.status === AssignedExamStatus.IN_EVALUATION ||
            snapshot.status === AssignedExamStatus.REGRADING
        ) {
            return snapshot.status;
        }

        if (snapshot.grade !== null) {
            return AssignedExamStatus.GRADED;
        }

        if (now < snapshot.applicationDate) {
            return AssignedExamStatus.PENDING;
        }

        const durationMinutes = snapshot.durationMinutes ?? 0;
        if (durationMinutes <= 0) {
            return AssignedExamStatus.ENABLED;
        }

        const endDate = new Date(snapshot.applicationDate.getTime() + durationMinutes * 60 * 1000);

        if (now > endDate) {
            return AssignedExamStatus.IN_EVALUATION;
        }

        return AssignedExamStatus.ENABLED;
    }

    private async getStudentByUserId(userId: string, operation: string) {
        const students = await this.studentRepo.list({
            filters: { userId },
            limit: 1,
            offset: 0,
        });
        const student = students[0];
        if (!student) {
            this.raiseNotFoundError(operation, 'ESTUDIANTE NO ENCONTRADO', {
                entity: 'Student',
            });
        }
        return student;
    }

    private async getTeacherByUserId(userId: string, operation: string) {
        const teachers = await this.teacherRepo.list({
            filters: { userId },
            limit: 1,
            offset: 0,
        });
        const teacher = teachers[0];
        if (!teacher) {
            this.raiseNotFoundError(operation, 'PROFESOR NO ENCONTRADO', {
                entity: 'Teacher',
            });
        }
        return teacher;
    }
}
