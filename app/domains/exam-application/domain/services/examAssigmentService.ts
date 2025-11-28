import { BaseDomainService } from '../../../../shared/domain/base_service';
import { ExamStatusEnum } from '../../../exam-generation/entities/enums/ExamStatusEnum';
import { ITeacherSubjectLinkRepository } from '../../../user/domain/ports/ITeacherSubjectLinkRepository';
import { ITeacherRepository } from '../../../user/domain/ports/ITeacherRepository';
import { IStudentRepository } from '../../../user/domain/ports/IStudentRepository';
import { StudentRead } from '../../../user/schemas/studentSchema';
import {
    AssignExamToCourseResponse,
} from '../../schemas/examAssignmentSchema';
import { IExamAssignmentRepository } from '../ports/IExamAssignmentRepository';



//TODO: ELIMINAR DESPUES, USAR EL REAL 
export interface IExamRepository {
    getExamStatus(examId: string): Promise<ExamStatusEnum | null>;
    getExamSubjectId(examId: string): Promise<string | null>;
    updateExamStatus(examId: string, status: ExamStatusEnum): Promise<void>;
}


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

    constructor({ examAssignmentRepo, examRepo, teacherRepo, teacherSubjectLinkRepo, studentRepo }: Deps) {
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
            await this.examRepo.updateExamStatus(examId, ExamStatusEnum.PUBLISHED);

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

        const subjectId = await this.examRepo.getExamSubjectId(examId);
        if (!subjectId) {
            this.raiseNotFoundError(operation, 'EXAMEN NO ENCONTRADO', { entity: 'Exam' });
        }

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
        const teachesSubject = assignments.teachingSubjectIds.includes(subjectId);
        if (!teachesSubject) {
            this.raiseBusinessRuleError(operation, 'PROFESOR NO ASIGNADO A LA MATERIA', {
                entity: 'Subject',
            });
        }

        return teacher.id;
    }

    private async getStudentsByCourse(course: string): Promise<StudentRead[]> {
        const operation = 'get-students-by-course';

        const courseNumber = parseInt(course, 10);
        if (isNaN(courseNumber)) {
            this.raiseBusinessRuleError(operation, 'CURSO INVÁLIDO', {
                entity: 'Course',
            });
        }

        const students = await this.studentRepo.list({
            filters: {
                course: courseNumber, //TODO: implementar filtro por curso
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
        const assignmentPromises = params.students.map(student =>
            this.examAssignmentRepo.createExamAssignment({
                examId: params.examId,
                studentId: student.id,
                professorId: params.professorId,
                applicationDate: params.applicationDate,
                durationMinutes: params.durationMinutes,
            })
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
        const status = await this.examRepo.getExamStatus(examId);
        if (!status) {
            this.raiseNotFoundError(operation, 'EXAMEN NO ENCONTRADO', { entity: 'Exam' });
        }
        if (status !== ExamStatusEnum.APPROVED) {
            this.raiseBusinessRuleError(operation, 'EXAMEN NO APROBADO AUN', {
                entity: 'Exam',
            });
        }
    }
}
