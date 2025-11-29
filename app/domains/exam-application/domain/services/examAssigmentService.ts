import { BaseDomainService } from '../../../../shared/domain/base_service';
import { IExamRepository } from '../../../exam-generation/domain/ports/IExamRepository';
import { IStudentRepository } from '../../../user/domain/ports/IStudentRepository';
import { ITeacherRepository } from '../../../user/domain/ports/ITeacherRepository';
import { ITeacherSubjectLinkRepository } from '../../../user/domain/ports/ITeacherSubjectLinkRepository';
import { StudentRead } from '../../../user/schemas/studentSchema';
import { AssignedExamStatus } from '../../entities/enums/AssignedExamStatus';
import { ExamStatusEnum } from '../../entities/enums/ExamStatusEnum';
import { AssignExamToCourseResponse } from '../../schemas/examAssignmentSchema';
import { IExamAssignmentRepository } from '../ports/IExamAssignmentRepository';

type Deps = {
    examAssignmentRepo: IExamAssignmentRepository;
    examRepo: IExamRepository;
    teacherRepo: ITeacherRepository;
    teacherSubjectLinkRepo: ITeacherSubjectLinkRepository;
    studentRepo: IStudentRepository;
};

export class ExamAssignmentService extends BaseDomainService {
    private readonly examAssignmentRepo: IExamAssignmentRepository;
    private readonly examRepo: IExamRepository;
    private readonly teacherRepo: ITeacherRepository;
    private readonly teacherSubjectLinkRepo: ITeacherSubjectLinkRepository;
    private readonly studentRepo: IStudentRepository;

    constructor({
        examAssignmentRepo,
        examRepo,
        teacherRepo,
        teacherSubjectLinkRepo,
        studentRepo,
    }: Deps) {
        super();
        this.examAssignmentRepo = examAssignmentRepo;
        this.examRepo = examRepo;
        this.teacherRepo = teacherRepo;
        this.teacherSubjectLinkRepo = teacherSubjectLinkRepo;
        this.studentRepo = studentRepo;
    }

    async createExamAssignment(
        examId: string,
        course: string,
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

            //Obtener todos los estudiantes de el curso
            const students = await this.getStudentsByCourse(course);

            if (students.length === 0) {
                this.raiseBusinessRuleError(operation, 'EL CURSO NO TIENE ESTUDIANTES ACTIVOS', {
                    entity: 'Course',
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
                course,
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

    private async getStudentsByCourse(course: string): Promise<StudentRead[]> {
        const students = await this.studentRepo.list({
            filters: {
                course: course,
            },
            limit: 1000,
            offset: 0,
        });

        return students;
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
}
