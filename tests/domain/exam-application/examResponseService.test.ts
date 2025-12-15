import { describe, it, expect, afterEach, vi } from 'vitest';

import { ExamResponseService } from '../../../app/domains/exam-application/domain/services/examResponseService';
import { AssignedExamStatus } from '../../../app/domains/exam-application/entities/enums/AssignedExamStatus';
import {
  BusinessRuleError,
  ForbiddenError,
  NotFoundError,
} from '../../../app/shared/exceptions/domainErrors';

vi.mock(
  '../../../app/core/dependencies/dependencies',
  () => ({
    __esModule: true,
    get_logger: () => ({
      auditLogger: { info: vi.fn() },
      errorLogger: { error: vi.fn() },
      debugLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      httpLogger: { info: vi.fn(), error: vi.fn() },
    }),
  }),
);

const makeExamResponseRepo = () =>
({
  create: vi.fn(),
  findById: vi.fn(),
  findByExamQuestionAndStudent: vi.fn(),
  update: vi.fn(),
  studentHasResponses: vi.fn(),
  listByExamAndStudent: vi.fn(),
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

afterEach(() => {
  vi.clearAllMocks();
});

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

describe('ExamResponseService', () => {
  const makeService = () => {
    const examResponseRepo = makeExamResponseRepo();
    const examAssignmentRepo = makeExamAssignmentRepo();
    const questionRepo = makeQuestionRepo();
    const studentRepo = makeStudentRepo();
    const examQuestionRepo = makeExamQuestionRepo();
    const teacherRepo = makeTeacherRepo();
    const teacherSubjectLinkRepo = makeTeacherSubjectLinkRepo();
    const examRegradeRepo = makeExamRegradeRepo();

    const service = new ExamResponseService({
      examResponseRepo,
      examAssignmentRepo,
      questionRepo,
      studentRepo,
      examQuestionRepo,
      teacherRepo,
      teacherSubjectLinkRepo,
      examRegradeRepo,
    });
    return {
      service,
      examResponseRepo,
      examAssignmentRepo,
      questionRepo,
      studentRepo,
      examQuestionRepo,
      teacherRepo,
      teacherSubjectLinkRepo,
      examRegradeRepo,
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

    // Simular que es un profesor
    studentRepo.list.mockResolvedValue([]);
    teacherRepo.list.mockResolvedValue([{ id: 'teacher2' }]);

    // Asignación pertenece a otro profesor (teacher1)
    examAssignmentRepo.findOneByExamIdAndProfessorId.mockResolvedValue({
      id: 'assign1',
      teacherId: 'teacher1',
      studentId: 'stu1',
      subjectId: 'sub1',
    });

    // Existe regrade para este profesor (teacher2)
    examRegradeRepo.findActiveByExamAndStudent.mockResolvedValue({
      id: 'regrade1',
      professorId: 'teacher2',
    });

    // El profesor tiene permisos sobre la materia (para pasar ensureTeacherCanReviewExam)
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
});
