import { BaseDomainService } from '../../../../shared/domain/base_service';
import { IExamRepository } from '../../../exam-generation/domain/ports/IExamRepository';
import { IStudentRepository } from '../../../user/domain/ports/IStudentRepository';
import { ITeacherRepository } from '../../../user/domain/ports/ITeacherRepository';
import { ITeacherSubjectLinkRepository } from '../../../user/domain/ports/ITeacherSubjectLinkRepository';
import { StudentRead } from '../../../user/schemas/studentSchema';
import { AssignedExamStatus } from '../../entities/enums/AssignedExamStatus';
import { ExamStatusEnum } from '../../entities/enums/ExamStatusEnum';
import { ExamRegradesStatus } from '../../entities/enums/ExamRegradeStatus';
import {
    AssignExamToCourseResponse,
    ListEvaluatorExamsQuery,
    SendExamToEvaluatorCommandSchema,
    StudentExamAssignmentItem,
} from '../../schemas/examAssignmentSchema';
import {
    ExamRegradeOutput,
    RequestExamRegradeCommandSchema,
} from '../../schemas/examRegradeSchema';
import type {
    ExamAssignmentStatusSnapshot,
    IExamAssignmentRepository,
} from '../ports/IExamAssignmentRepository';
import type { IExamResponseRepository } from '../ports/IExamResponseRepository';
import type { IExamRegradeRepository } from '../ports/IExamRegradeRepository';

type Deps = {
    examAssignmentRepo: IExamAssignmentRepository;
    examRepo: IExamRepository;
    teacherRepo: ITeacherRepository;
    teacherSubjectLinkRepo: ITeacherSubjectLinkRepository;
    studentRepo: IStudentRepository;
    examResponseRepo: IExamResponseRepository;
    examRegradeRepo: IExamRegradeRepository;
};

export class ExamAssignmentService extends BaseDomainService {
    private readonly examAssignmentRepo: IExamAssignmentRepository;
    private readonly examRepo: IExamRepository;
    private readonly teacherRepo: ITeacherRepository;
    private readonly teacherSubjectLinkRepo: ITeacherSubjectLinkRepository;
    private readonly studentRepo: IStudentRepository;
    private readonly examResponseRepo: IExamResponseRepository;
    private readonly examRegradeRepo: IExamRegradeRepository;

    constructor({
        examAssignmentRepo,
        examRepo,
        teacherRepo,
        teacherSubjectLinkRepo,
        studentRepo,
        examResponseRepo,
        examRegradeRepo,
    }: Deps) {
        super();
        this.examAssignmentRepo = examAssignmentRepo;
        this.examRepo = examRepo;
        this.teacherRepo = teacherRepo;
        this.teacherSubjectLinkRepo = teacherSubjectLinkRepo;
        this.studentRepo = studentRepo;
        this.examResponseRepo = examResponseRepo;
        this.examRegradeRepo = examRegradeRepo;
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

            const allowedStatuses = [
                AssignedExamStatus.ENABLED,
                AssignedExamStatus.DURING_SOLUTION,
                AssignedExamStatus.SUBMITTED,
            ];
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

            if (assignment.status !== AssignedExamStatus.GRADED) {
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

            await this.ensureTeacherCanReviewExam(operation, teacher.id, assignment.subjectId);

            const regrade = await this.examRegradeRepo.create({
                examId: input.examId,
                studentId: student.id,
                professorId: teacher.id,
                reason: input.reason ?? null,
                status: ExamRegradesStatus.REQUESTED,
                requestedAt: new Date(),
            });

            this.logOperationSuccess(operation);
            return regrade;
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
        const assignments = await this.teacherSubjectLinkRepo.getAssignments(teacherId);
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
            }
        }
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
            snapshot.status === AssignedExamStatus.IN_EVALUATION
        ) {
            return snapshot.status;
        }

        if (snapshot.grade !== null) {
            return AssignedExamStatus.GRADED;
        }

        if (now < snapshot.applicationDate) {
            return AssignedExamStatus.PENDING;
        }

        const hasResponses = await this.examResponseRepo.studentHasResponses(
            snapshot.examId,
            snapshot.studentId,
        );

        if (hasResponses) {
            return AssignedExamStatus.SUBMITTED;
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
