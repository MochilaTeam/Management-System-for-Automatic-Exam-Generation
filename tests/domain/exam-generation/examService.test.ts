import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';

vi.mock('../../../app/infrastructure/question-bank/models/Subject', () => ({
  __esModule: true,
  default: { findByPk: vi.fn() },
}));

vi.mock('../../../app/infrastructure/user/models', () => ({
  __esModule: true,
  Teacher: { findOne: vi.fn() },
}));

import { ExamService } from '../../../app/domains/exam-generation/domain/services/examService';
import { ExamStatusEnum } from '../../../app/domains/exam-application/entities/enums/ExamStatusEnum';
import { DifficultyLevelEnum } from '../../../app/domains/question-bank/entities/enums/DifficultyLevels';
import SubjectModel from '../../../app/infrastructure/question-bank/models/Subject';
import { Teacher as TeacherModel } from '../../../app/infrastructure/user/models';

const SubjectMock = SubjectModel as any;
const TeacherMock = TeacherModel as any;

const makeExamRepo = () =>
  ({
    paginate: vi.fn(),
    get_by_id: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteById: vi.fn(),
  } as any);

const makeExamQuestionRepo = () =>
  ({
    listByExamId: vi.fn(),
    replaceExamQuestions: vi.fn(),
  } as any);

const makeQuestionRepo = () =>
  ({
    findByIds: vi.fn(),
    findRandomByFilters: vi.fn(),
  } as any);

beforeAll(() => {
  vi.spyOn(ExamService.prototype as any, 'raiseBusinessRuleError').mockImplementation(
    (...args: any[]) => {
      const message = args[1] ?? 'BUSINESS_RULE_ERROR';
      throw new Error(message);
    },
  );
  vi.spyOn(ExamService.prototype as any, 'raiseNotFoundError').mockImplementation(
    (...args: any[]) => {
      const message = args[1] ?? 'NOT_FOUND';
      throw new Error(message);
    },
  );
  vi.spyOn(ExamService.prototype as any, 'raiseValidationError').mockImplementation(
    (...args: any[]) => {
      const message = args[1] ?? 'VALIDATION_ERROR';
      throw new Error(message);
    },
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ExamService', () => {
  const makeService = () => {
    const examRepo = makeExamRepo();
    const examQuestionRepo = makeExamQuestionRepo();
    const questionRepo = makeQuestionRepo();
    const service = new ExamService({ examRepo, examQuestionRepo, questionRepo });
    return { service, examRepo, examQuestionRepo, questionRepo };
  };

  it('paginate: envuelve respuesta del repositorio', async () => {
    const { service, examRepo } = makeService();
    examRepo.paginate.mockResolvedValue({ items: [{ id: 'e1' }], total: 1 });

    const res = await service.paginate({ limit: 5, offset: 0, authorId: 't1' } as any);

    expect(examRepo.paginate).toHaveBeenCalledWith({
      limit: 5,
      offset: 0,
      filters: {
        subjectId: undefined,
        difficulty: undefined,
        examStatus: undefined,
        authorId: 't1',
        validatorId: undefined,
        title: undefined,
      },
    });
    expect(res).toEqual({ list: [{ id: 'e1' }], total: 1 });
  });

  it('getById: retorna null si el examen no existe', async () => {
    const { service, examRepo, examQuestionRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue(null);

    const res = await service.getById('missing');

    expect(res).toBeNull();
    expect(examQuestionRepo.listByExamId).not.toHaveBeenCalled();
  });

  it('createManualExam: normaliza preguntas, calcula dificultad y devuelve detalle', async () => {
    const { service, examRepo, examQuestionRepo, questionRepo } = makeService();

    TeacherMock.findOne.mockResolvedValue({
      get: () => ({ id: 'teacher-1', userId: 'user-1', hasRoleSubjectLeader: false }),
    });

    questionRepo.findByIds.mockResolvedValue([
      {
        id: 'q1',
        difficulty: DifficultyLevelEnum.EASY,
        questionTypeId: 'qt1',
        subTopicId: null,
        topicId: 'topic1',
      },
      {
        id: 'q2',
        difficulty: DifficultyLevelEnum.HARD,
        questionTypeId: 'qt1',
        subTopicId: null,
        topicId: 'topic1',
      },
    ]);

    examRepo.create.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
    });
    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
      title: 'Manual',
      difficulty: DifficultyLevelEnum.MEDIUM,
      examStatus: ExamStatusEnum.DRAFT,
      authorId: 'teacher-1',
      validatorId: null,
      observations: null,
      questionCount: 2,
      topicProportion: {},
      topicCoverage: {},
    });
    examQuestionRepo.listByExamId.mockResolvedValue([{ id: 'eq1' }]);

    const res = await service.createManualExam({
      title: 'Manual',
      subjectId: 'sub-1',
      authorId: 'user-1',
      questions: [
        { questionId: 'q2', questionIndex: 2, questionScore: 2 },
        { questionId: 'q1', questionIndex: 1, questionScore: 1 },
      ],
    } as any);

    expect(questionRepo.findByIds).toHaveBeenCalledWith(['q1', 'q2']);
    expect(examRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        difficulty: DifficultyLevelEnum.MEDIUM,
        questionCount: 2,
      }),
    );
    expect(examQuestionRepo.replaceExamQuestions).toHaveBeenCalledWith('exam-1', [
      { questionId: 'q1', questionIndex: 1, questionScore: 1 },
      { questionId: 'q2', questionIndex: 2, questionScore: 2 },
    ]);
    expect(res.questions).toEqual([{ id: 'eq1' }]);
  });

  it('createAutomaticExam: lanza error si no hay suficientes preguntas para un slot', async () => {
    const { service, questionRepo } = makeService();
    TeacherMock.findOne.mockResolvedValue({
      get: () => ({ id: 'teacher-1', userId: 'user-1', hasRoleSubjectLeader: true }),
    });
    questionRepo.findRandomByFilters.mockResolvedValue([]);

    await expect(
      service.createAutomaticExam({
        title: 'Auto',
        subjectId: 'sub-1',
        authorId: 'user-1',
        questionCount: 1,
        questionTypeCounts: [{ questionTypeId: 'qt1', count: 1 }],
        difficultyCounts: {
          [DifficultyLevelEnum.EASY]: 1,
          [DifficultyLevelEnum.MEDIUM]: 0,
          [DifficultyLevelEnum.HARD]: 0,
        },
      } as any),
    ).rejects.toThrow('No hay suficientes preguntas para la parametrización solicitada.');
  });

  it('ensureQuestionsPayload: valida cantidad, duplicados e indices', () => {
    const { service } = makeService();
    const call = (questions: any[], expected: number) =>
      (service as any).ensureQuestionsPayload(questions, expected, 'op');

    expect(() => call([{ questionId: 'q1', questionIndex: 1, questionScore: 1 }], 2)).toThrow(
      'La cantidad de preguntas no coincide con el total.',
    );

    expect(() =>
      call(
        [
          { questionId: 'q1', questionIndex: 1, questionScore: 1 },
          { questionId: 'q1', questionIndex: 2, questionScore: 1 },
        ],
        2,
      ),
    ).toThrow('Hay preguntas duplicadas en la solicitud.');

    expect(() =>
      call(
        [
          { questionId: 'q1', questionIndex: 1, questionScore: 1 },
          { questionId: 'q2', questionIndex: 1, questionScore: -1 },
        ],
        2,
      ),
    ).toThrow('Los índices de las preguntas deben ser únicos.');
  });

  it('deriveDifficultyFromDistribution: devuelve MEDIUM cuando no hay conteo', () => {
    const { service } = makeService();
    const diff = (service as any).deriveDifficultyFromDistribution({
      [DifficultyLevelEnum.EASY]: 0,
      [DifficultyLevelEnum.MEDIUM]: 0,
      [DifficultyLevelEnum.HARD]: 0,
    });
    expect(diff).toBe(DifficultyLevelEnum.MEDIUM);
  });

  it('buildSelectionPlan: lanza error cuando quedan dificultades sin asignar', () => {
    const { service } = makeService();

    expect(() =>
      (service as any).buildSelectionPlan(
        'op',
        2,
        [{ questionTypeId: 'qt1', count: 1 }],
        {
          [DifficultyLevelEnum.EASY]: 0,
          [DifficultyLevelEnum.MEDIUM]: 2,
          [DifficultyLevelEnum.HARD]: 0,
        },
      ),
    ).toThrow('No se puede cumplir la combinación de tipos y dificultades solicitada.');
  });

  it('updateExam: recalcula dificultad y reemplaza preguntas', async () => {
    const { service, examRepo, examQuestionRepo, questionRepo } = makeService();

    const exam = {
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.DRAFT,
    } as any;
    examRepo.get_by_id.mockResolvedValue(exam);
    examRepo.update.mockResolvedValue({ ...exam, title: 'Nuevo' });
    examQuestionRepo.listByExamId.mockResolvedValue([]);

    questionRepo.findByIds.mockResolvedValue([
      {
        id: 'q1',
        difficulty: DifficultyLevelEnum.EASY,
        questionTypeId: 'qt1',
        subTopicId: null,
        topicId: 'topic1',
      },
    ]);

    const res = await service.updateExam('exam-1', {
      title: 'Nuevo',
      observations: 'obs',
      questions: [{ questionId: 'q1', questionIndex: 2, questionScore: 1 }],
    } as any);

    expect(examRepo.update).toHaveBeenCalledWith('exam-1', {
      examStatus: ExamStatusEnum.DRAFT,
      validatorId: null,
      validatedAt: null,
      title: 'Nuevo',
      observations: 'obs',
      topicProportion: { topic1: 1 },
      topicCoverage: {
        mode: 'manual-update',
        subjectId: 'sub-1',
        difficulty: DifficultyLevelEnum.EASY,
        sourceQuestions: ['q1'],
      },
      questionCount: 1,
      difficulty: DifficultyLevelEnum.EASY,
    });
    expect(examQuestionRepo.replaceExamQuestions).toHaveBeenCalledWith('exam-1', [
      { questionId: 'q1', questionIndex: 2, questionScore: 1 },
    ]);
    expect(res.id).toBe('exam-1');
  });

  it('deleteExam: lanza error si no existe', async () => {
    const { service, examRepo } = makeService();
    examRepo.deleteById.mockResolvedValue(false);

    await expect(service.deleteExam('missing')).rejects.toThrow('El examen no existe.');
  });

  it('requestExamReview: valida estado bajo revisión', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.UNDER_REVIEW,
    });

    await expect(service.requestExamReview('exam-1', 'user-1')).rejects.toThrow(
      'El examen ya está en revisión.',
    );
  });

  it('acceptExam: solo permite exámenes en revisión', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.DRAFT,
    });

    await expect(service.acceptExam('exam-1', 'user-1')).rejects.toThrow(
      'Solo se pueden aceptar exámenes en revisión.',
    );
  });
});
