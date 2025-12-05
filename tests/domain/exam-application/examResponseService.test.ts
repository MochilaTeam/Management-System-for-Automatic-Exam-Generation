import { describe, it, expect, afterEach, vi } from 'vitest';

import { ExamResponseService } from '../../../app/domains/exam-application/domain/services/examResponseService';
import { AssignedExamStatus } from '../../../app/domains/exam-application/entities/enums/AssignedExamStatus';
import {
  BusinessRuleError,
  ForbiddenError,
  NotFoundError,
} from '../../../app/shared/exceptions/domainErrors';

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

describe('ExamResponseService', () => {
  const makeService = () => {
    const examResponseRepo = makeExamResponseRepo();
    const examAssignmentRepo = makeExamAssignmentRepo();
    const questionRepo = makeQuestionRepo();
    const studentRepo = makeStudentRepo();
    const examQuestionRepo = makeExamQuestionRepo();
    const service = new ExamResponseService({
      examResponseRepo,
      examAssignmentRepo,
      questionRepo,
      studentRepo,
      examQuestionRepo,
    });
    return { service, examResponseRepo, examAssignmentRepo, questionRepo, studentRepo, examQuestionRepo };
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
});
