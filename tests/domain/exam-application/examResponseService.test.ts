import { describe, it, expect, afterEach, vi } from 'vitest';

import { ExamResponseService } from '../../../app/domains/exam-application/domain/services/examResponseService';
import { AssignedExamStatus } from '../../../app/domains/exam-application/entities/enums/AssignedExamStatus';
import {
    BusinessRuleError,
    ForbiddenError,
    NotFoundError,
} from '../../../app/shared/exceptions/domainErrors';

vi.mock('../../../app/core/dependencies/dependencies', () => ({
    __esModule: true,
    get_logger: () => ({
        auditLogger: { info: vi.fn() },
        errorLogger: { error: vi.fn() },
        debugLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
        httpLogger: { info: vi.fn(), error: vi.fn() },
    }),
}));

const makeExamResponseRepo = () =>
    ({
        create: vi.fn(),
        findById: vi.fn(),
        findByExamQuestionAndStudent: vi.fn(),
        update: vi.fn(),
        studentHasResponses: vi.fn(),
        listByExamAndStudent: vi.fn(),
        updateManualPoints: vi.fn(),
    } as any);

const makeExamAssignmentRepo = () =>
    ({
        findByExamIdAndStudentId: vi.fn(),
        findOneByExamIdAndProfessorId: vi.fn(),
    } as any);

const makeQuestionRepo = () =>
    ({
        get_detail_by_id: vi.fn(),
    } as any);

const makeStudentRepo = () =>
    ({
        list: vi.fn(),
    } as any);

const makeExamQuestionRepo = () =>
    ({
        getById: vi.fn(),
        findByExamIdAndIndex: vi.fn(),
    } as any);

const makeTeacherRepo = () =>
    ({
        list: vi.fn(),
    } as any);

const makeTeacherSubjectLinkRepo = () =>
    ({
        getAssignments: vi.fn(),
    } as any);

const makeExamRegradeRepo = () =>
    ({
        findActiveByExamAndStudent: vi.fn(),
        findAnyActiveByExamAndProfessor: vi.fn(),
    } as any);

afterEach(() => {
    vi.clearAllMocks();
});

describe('ExamResponseService', () => {
    const makeService = () => {
        const examResponseRepo = makeExamResponseRepo();
        const examAssignmentRepo = makeExamAssignmentRepo();
        const examRegradeRepo = makeExamRegradeRepo();
        const questionRepo = makeQuestionRepo();
        const studentRepo = makeStudentRepo();
        const examQuestionRepo = makeExamQuestionRepo();
        const teacherRepo = makeTeacherRepo();
        const teacherSubjectLinkRepo = makeTeacherSubjectLinkRepo();
        const service = new ExamResponseService({
            examResponseRepo,
            examAssignmentRepo,
            examRegradeRepo,
            questionRepo,
            studentRepo,
            examQuestionRepo,
            teacherRepo,
            teacherSubjectLinkRepo,
        });
        return {
            service,
            examResponseRepo,
            examAssignmentRepo,
            examRegradeRepo,
            questionRepo,
            studentRepo,
            examQuestionRepo,
            teacherRepo,
            teacherSubjectLinkRepo,
        };
    };

    it('createExamResponse: calcula autoPoints y guarda respuesta', async () => {
        const { service, examResponseRepo, examAssignmentRepo, questionRepo, studentRepo, examQuestionRepo } =
            makeService();

        studentRepo.list.mockResolvedValue([{ id: 'stu1' }]);
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
            status: AssignedExamStatus.ENABLED,
        });
        examQuestionRepo.getById.mockResolvedValue({ id: 'eq1', questionId: 'q1' });
        questionRepo.get_detail_by_id.mockResolvedValue({
            id: 'q1',
            options: [
                { text: 'A', isCorrect: true },
                { text: 'B', isCorrect: false },
            ],
        });
        const created = { id: 'resp1' } as any;
        examResponseRepo.create.mockResolvedValue(created);

        const result = await service.createExamResponse({
            examId: 'exam1',
            examQuestionId: 'eq1',
            user_id: 'user-1',
            selectedOptions: [
                { text: 'A', isCorrect: true },
                { text: 'B', isCorrect: false },
            ],
            textAnswer: null,
        } as any);

        expect(examResponseRepo.create).toHaveBeenCalledWith(
            expect.objectContaining({
                examId: 'exam1',
                examQuestionId: 'eq1',
                studentId: 'stu1',
                selectedOptions: [
                    { text: 'A', isCorrect: true },
                    { text: 'B', isCorrect: false },
                ],
                autoPoints: 0,
            }),
        );
        expect(result).toBe(created);
    });

    it('createExamResponse: lanza error si la asignación no está activa', async () => {
        const { service, examAssignmentRepo, studentRepo, examQuestionRepo } = makeService();

        studentRepo.list.mockResolvedValue([{ id: 'stu1' }]);
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
            status: AssignedExamStatus.SUBMITTED,
        });
        examQuestionRepo.getById.mockResolvedValue({ id: 'eq1', questionId: 'q1' });

        await expect(
            service.createExamResponse({
                examId: 'exam1',
                examQuestionId: 'eq1',
                user_id: 'user-1',
            } as any),
        ).rejects.toBeInstanceOf(BusinessRuleError);
    });

    it('createExamResponse: lanza NotFound si la pregunta del examen no existe', async () => {
        const { service, studentRepo, examAssignmentRepo, examQuestionRepo } = makeService();

        studentRepo.list.mockResolvedValue([{ id: 'stu1' }]);
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
            status: AssignedExamStatus.ENABLED,
        });
        examQuestionRepo.getById.mockResolvedValue(null);

        await expect(
            service.createExamResponse({
                examId: 'exam1',
                examQuestionId: 'eq1',
                user_id: 'user-1',
            } as any),
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('createExamResponse: lanza NotFound cuando no se encuentra el estudiante', async () => {
        const { service, studentRepo } = makeService();
        studentRepo.list.mockResolvedValue([]);

        await expect(
            service.createExamResponse({
                examId: 'exam1',
                examQuestionId: 'eq1',
                user_id: 'user-1',
            } as any),
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('createExamResponse: lanza NotFound si la pregunta original no existe', async () => {
        const { service, studentRepo, examAssignmentRepo, examQuestionRepo, questionRepo } =
            makeService();

        studentRepo.list.mockResolvedValue([{ id: 'stu1' }]);
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
            status: AssignedExamStatus.ENABLED,
        });
        examQuestionRepo.getById.mockResolvedValue({ id: 'eq1', questionId: 'q1' });
        questionRepo.get_detail_by_id.mockResolvedValue(null);

        await expect(
            service.createExamResponse({
                examId: 'exam1',
                examQuestionId: 'eq1',
                user_id: 'user-1',
            } as any),
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('updateExamResponse: prohibe modificar respuestas de otro estudiante', async () => {
        const { service, examResponseRepo, studentRepo } = makeService();

        studentRepo.list.mockResolvedValue([{ id: 'stu1' }]);
        examResponseRepo.findById.mockResolvedValue({
            id: 'resp1',
            examQuestionId: 'eq1',
            examId: 'exam1',
            studentId: 'other',
        });

        await expect(
            service.updateExamResponse({
                responseId: 'resp1',
                user_id: 'user-1',
                selectedOptions: [],
            } as any),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('updateExamResponse: recalcula autoPoints y actualiza respuesta existente', async () => {
        const { service, examResponseRepo, examAssignmentRepo, questionRepo, studentRepo, examQuestionRepo } =
            makeService();

        studentRepo.list.mockResolvedValue([{ id: 'stu1' }]);
        examResponseRepo.findById.mockResolvedValue({
            id: 'resp1',
            examId: 'exam1',
            examQuestionId: 'eq1',
            studentId: 'stu1',
        });
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
            status: AssignedExamStatus.ENABLED,
        });
        examQuestionRepo.getById.mockResolvedValue({ id: 'eq1', questionId: 'q1' });
        questionRepo.get_detail_by_id.mockResolvedValue({
            id: 'q1',
            options: null,
        });
        examResponseRepo.update.mockResolvedValue({ id: 'resp1', autoPoints: null });

        const updated = await service.updateExamResponse({
            responseId: 'resp1',
            user_id: 'user-1',
            selectedOptions: null,
            textAnswer: 'texto',
        } as any);

        expect(examResponseRepo.update).toHaveBeenCalledWith(
            expect.objectContaining({
                responseId: 'resp1',
                selectedOptions: null,
                textAnswer: 'texto',
                autoPoints: null,
            }),
        );
        expect(updated).toEqual({ id: 'resp1', autoPoints: null });
    });

    it('getResponseByQuestionIndex: lanza NotFound si no existe la pregunta en el examen', async () => {
        const { service, studentRepo, examQuestionRepo } = makeService();

        studentRepo.list.mockResolvedValue([{ id: 'stu1' }]);
        examQuestionRepo.findByExamIdAndIndex.mockResolvedValue(null);

        await expect(
            service.getResponseByQuestionIndex({
                examId: 'exam1',
                questionIndex: 2,
                user_id: 'user-1',
            } as any),
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('getResponseByQuestionIndex: exige indicar estudiante cuando el actor es profesor', async () => {
        const { service, teacherRepo, studentRepo } = makeService();
        studentRepo.list.mockResolvedValue([]);
        teacherRepo.list.mockResolvedValue([{ id: 'teacher-1' }]);

        await expect(
            service.getResponseByQuestionIndex({
                examId: 'exam1',
                questionIndex: 1,
                user_id: 'teacher-user',
            } as any),
        ).rejects.toBeInstanceOf(BusinessRuleError);
    });

    it('getResponseByQuestionIndex: permite acceso a profesor no asignado si tiene solicitud de regrade', async () => {
        const {
            service,
            studentRepo,
            teacherRepo,
            examAssignmentRepo,
            examRegradeRepo,
            teacherSubjectLinkRepo,
            examQuestionRepo,
            examResponseRepo,
        } = makeService();

        studentRepo.list.mockResolvedValue([]);
        teacherRepo.list.mockResolvedValue([{ id: 'teacher2' }]);
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
            id: 'assign1',
            teacherId: 'teacher1',
            studentId: 'stu1',
            subjectId: 'sub1',
            status: AssignedExamStatus.ENABLED,
        });
        examRegradeRepo.findActiveByExamAndStudent.mockResolvedValue({
            id: 'regrade1',
            professorId: 'teacher2',
        });
        teacherSubjectLinkRepo.getAssignments.mockResolvedValue({
            teachingSubjectIds: ['sub1'],
            leadSubjectIds: [],
        });
        examQuestionRepo.findByExamIdAndIndex.mockResolvedValue({ id: 'eq1', questionId: 'q1' });
        examResponseRepo.findByExamQuestionAndStudent.mockResolvedValue({ id: 'resp1' });

        const result = await service.getResponseByQuestionIndex({
            examId: 'exam1',
            questionIndex: 1,
            user_id: 'user-teacher-2',
            studentId: 'stu1',
        } as any);

        expect(result).toBeDefined();
        expect(result.id).toBe('resp1');
    });

    it('getQuestionDetailByIndex: permite acceso al profesor validando la asignación', async () => {
        const {
            service,
            teacherRepo,
            studentRepo,
            examAssignmentRepo,
            teacherSubjectLinkRepo,
            examQuestionRepo,
            questionRepo,
        } = makeService();

        studentRepo.list.mockResolvedValue([]);
        teacherRepo.list.mockResolvedValue([{ id: 't1' }]);
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
            id: 'assign-1',
            examId: 'exam1',
            studentId: 'stu2',
            teacherId: 't1',
            subjectId: 'sub1',
            status: AssignedExamStatus.ENABLED,
        });
        teacherSubjectLinkRepo.getAssignments.mockResolvedValue({
            teachingSubjectIds: ['sub1'],
            leadSubjectIds: [],
        });
        examQuestionRepo.findByExamIdAndIndex.mockResolvedValue({
            id: 'eq1',
            questionId: 'q1',
        });
        const detail = { id: 'q1', body: 'Pregunta' } as any;
        questionRepo.get_detail_by_id.mockResolvedValue(detail);

        const result = await service.getQuestionDetailByIndex({
            examId: 'exam1',
            questionIndex: 1,
            user_id: 'teacher-user',
            studentId: 'stu2',
        } as any);

        expect(result).toBe(detail);
        expect(questionRepo.get_detail_by_id).toHaveBeenCalledWith('q1', true);
    });

    it('getQuestionDetailByIndex: lanza NotFound cuando la pregunta original no existe', async () => {
        const {
            service,
            studentRepo,
            examAssignmentRepo,
            examQuestionRepo,
            questionRepo,
        } = makeService();

        studentRepo.list.mockResolvedValue([{ id: 'stu1' }]);
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
            subjectId: 'sub1',
            status: AssignedExamStatus.ENABLED,
        });
        examQuestionRepo.findByExamIdAndIndex.mockResolvedValue({ id: 'eq1', questionId: 'q1' });
        questionRepo.get_detail_by_id.mockResolvedValue(null);

        await expect(
            service.getQuestionDetailByIndex({
                examId: 'exam1',
                questionIndex: 1,
                user_id: 'user-1',
            } as any),
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('getQuestionDetailByIndex: evita acceso cuando el profesor no es el asignado', async () => {
        const {
            service,
            studentRepo,
            teacherRepo,
            examAssignmentRepo,
            examQuestionRepo,
            questionRepo,
            teacherSubjectLinkRepo,
        } = makeService();

        studentRepo.list.mockResolvedValue([]);
        teacherRepo.list.mockResolvedValue([{ id: 't-1' }]);
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
            id: 'assign-1',
            examId: 'exam1',
            studentId: 'stu2',
            teacherId: 'other',
            subjectId: 'sub1',
            status: AssignedExamStatus.ENABLED,
        });
        teacherSubjectLinkRepo.getAssignments.mockResolvedValue({
            teachingSubjectIds: ['sub1'],
            leadSubjectIds: [],
        });
        examQuestionRepo.findByExamIdAndIndex.mockResolvedValue({ id: 'eq1', questionId: 'q1' });
        questionRepo.get_detail_by_id.mockResolvedValue({ id: 'q1' } as any);

        await expect(
            service.getQuestionDetailByIndex({
                examId: 'exam1',
                questionIndex: 1,
                user_id: 'teacher-user',
                studentId: 'stu2',
            } as any),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('getQuestionDetailByIndex: lanza NotFound si la pregunta en el examen no existe', async () => {
        const { service, studentRepo, examAssignmentRepo, examQuestionRepo } = makeService();

        studentRepo.list.mockResolvedValue([{ id: 'stu1' }]);
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
            status: AssignedExamStatus.ENABLED,
        });
        examQuestionRepo.findByExamIdAndIndex.mockResolvedValue(null);

        await expect(
            service.getQuestionDetailByIndex({
                examId: 'exam1',
                questionIndex: 1,
                user_id: 'user-1',
            } as any),
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('getQuestionDetailByIndex: lanza NotFound cuando la asignación no existe para el profesor', async () => {
        const { service, studentRepo, teacherRepo, examAssignmentRepo } = makeService();
        studentRepo.list.mockResolvedValue([]);
        teacherRepo.list.mockResolvedValue([{ id: 't-1' }]);
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue(null);

        await expect(
            service.getQuestionDetailByIndex({
                examId: 'exam1',
                questionIndex: 1,
                user_id: 'teacher-user',
                studentId: 'stu-1',
            } as any),
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('getResponseByQuestionIndex: lanza NotFound cuando no existe respuesta', async () => {
        const {
            service,
            studentRepo,
            examAssignmentRepo,
            examQuestionRepo,
            examResponseRepo,
        } = makeService();

        studentRepo.list.mockResolvedValue([{ id: 'stu1' }]);
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
            status: AssignedExamStatus.ENABLED,
        });
        examQuestionRepo.findByExamIdAndIndex.mockResolvedValue({ id: 'eq1' });
        examResponseRepo.findByExamQuestionAndStudent.mockResolvedValue(null);

        await expect(
            service.getResponseByQuestionIndex({
                examId: 'exam1',
                questionIndex: 1,
                user_id: 'user-1',
            } as any),
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('updateManualPoints: valida permisos del profesor y actualiza manualPoints', async () => {
        const {
            service,
            teacherRepo,
            teacherSubjectLinkRepo,
            examResponseRepo,
            examAssignmentRepo,
            studentRepo,
        } = makeService();

        studentRepo.list.mockResolvedValue([]);
        teacherRepo.list.mockResolvedValue([{ id: 't1' }]);
        examResponseRepo.findById.mockResolvedValue({
            id: 'resp1',
            examId: 'exam1',
            studentId: 'stu1',
        });
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
            id: 'assign-1',
            subjectId: 'sub1',
            teacherId: 't1',
        });
        teacherSubjectLinkRepo.getAssignments.mockResolvedValue({
            teachingSubjectIds: ['sub1'],
            leadSubjectIds: [],
        });
        examResponseRepo.updateManualPoints.mockResolvedValue(undefined);

        await service.updateManualPoints({
            responseId: 'resp1',
            manualPoints: 3,
            currentUserId: 'teacher-user',
        });

        expect(examResponseRepo.updateManualPoints).toHaveBeenCalledWith('resp1', 3);
    });

    it('updateManualPoints: rechaza cuando el profesor no está asignado al curso', async () => {
        const {
            service,
            teacherRepo,
            teacherSubjectLinkRepo,
            examResponseRepo,
            examAssignmentRepo,
            studentRepo,
        } = makeService();

        studentRepo.list.mockResolvedValue([]);
        teacherRepo.list.mockResolvedValue([{ id: 't1' }]);
        examResponseRepo.findById.mockResolvedValue({
            id: 'resp1',
            examId: 'exam1',
            studentId: 'stu1',
        });
        examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
            id: 'assign-1',
            subjectId: 'sub1',
            teacherId: 't1',
        });
        teacherSubjectLinkRepo.getAssignments.mockResolvedValue({
            teachingSubjectIds: [],
            leadSubjectIds: [],
        });

        await expect(
            service.updateManualPoints({
                responseId: 'resp1',
                manualPoints: 2,
                currentUserId: 'teacher-user',
            }),
        ).rejects.toBeInstanceOf(BusinessRuleError);
    });
});
