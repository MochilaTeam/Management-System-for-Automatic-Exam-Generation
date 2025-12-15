import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';

vi.mock('../../../app/infrastructure/question-bank/models/Subject', () => ({
  __esModule: true,
  default: { findByPk: vi.fn() },
}));

vi.mock('../../../app/infrastructure/user/models', () => ({
  __esModule: true,
  Teacher: { findOne: vi.fn() },
}));

vi.mock('../../../app/infrastructure/question-bank/models/TeacherSubject', () => ({
  __esModule: true,
  default: { findOne: vi.fn() },
}));

import { ExamService } from '../../../app/domains/exam-generation/domain/services/examService';
import { ExamStatusEnum } from '../../../app/domains/exam-application/entities/enums/ExamStatusEnum';
import { DifficultyLevelEnum } from '../../../app/domains/question-bank/entities/enums/DifficultyLevels';
import SubjectModel from '../../../app/infrastructure/question-bank/models/Subject';
import { Teacher as TeacherModel } from '../../../app/infrastructure/user/models';
import TeacherSubjectModel from '../../../app/infrastructure/question-bank/models/TeacherSubject';

const SubjectMock = SubjectModel as any;
const TeacherMock = TeacherModel as any;
const TeacherSubjectMock = TeacherSubjectModel as any;
TeacherMock.findByPk = vi.fn();

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
    getGroupedCounts: vi.fn(),
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
  vi.restoreAllMocks();
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
        subjectIds: undefined,
        difficulty: undefined,
        examStatus: undefined,
        active: true,
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
      active: true,
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
    questionRepo.getGroupedCounts.mockResolvedValue([
      { questionTypeId: 'qt1', difficulty: DifficultyLevelEnum.EASY, count: 0 },
    ]);
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
    ).rejects.toThrow(
      'No hay suficientes preguntas disponibles para satisfacer la combinación de tipos y dificultades solicitada.',
    );
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
        [{ questionTypeId: 'qt1', difficulty: DifficultyLevelEnum.MEDIUM, count: 1 }],
      ),
    ).toThrow('Error interno en la asignación de preguntas');
  });

  it('updateExam: recalcula dificultad y reemplaza preguntas', async () => {
    const { service, examRepo, examQuestionRepo, questionRepo } = makeService();

    const exam = {
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.DRAFT,
      active: true,
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

  it('updateExam: lanza NotFound cuando el examen no existe', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue(null);

    await expect(
      service.updateExam('missing', { title: 'x', questions: [] } as any),
    ).rejects.toThrow('El examen solicitado no existe.');
  });

  it('deleteExam: devuelve true si ya estaba inactivo', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      examStatus: ExamStatusEnum.VALID,
      active: false,
    });

    const result = await service.deleteExam('exam-1');
    expect(result).toBe(true);
    expect(examRepo.update).not.toHaveBeenCalled();
  });

  it('deleteExam: lanza error si no existe', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue(null);

    await expect(service.deleteExam('missing')).rejects.toThrow('El examen no existe.');
  });

  it('deleteExam: elimina físicamente si el estado es borrador', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      examStatus: ExamStatusEnum.DRAFT,
      active: true,
    });
    examRepo.deleteById.mockResolvedValue(true);

    const result = await service.deleteExam('exam-1');

    expect(examRepo.deleteById).toHaveBeenCalledWith('exam-1');
    expect(examRepo.update).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('deleteExam: desactiva si no es borrador', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      examStatus: ExamStatusEnum.PUBLISHED,
      active: true,
    });
    examRepo.update.mockResolvedValue({
      id: 'exam-1',
      examStatus: ExamStatusEnum.PUBLISHED,
      active: false,
    });

    const result = await service.deleteExam('exam-1');

    expect(examRepo.deleteById).not.toHaveBeenCalled();
    expect(examRepo.update).toHaveBeenCalledWith('exam-1', { active: false });
    expect(result).toBe(true);
  });

  it('requestExamReview: valida estado bajo revisión', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.UNDER_REVIEW,
      active: true,
    });

    await expect(service.requestExamReview('exam-1', 'user-1')).rejects.toThrow(
      'El examen ya está en revisión.',
    );
  });

  it('requestExamReview: rechaza si el examen ya fue aprobado', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.APPROVED,
      active: true,
    });

    await expect(service.requestExamReview('exam-1', 'user-1')).rejects.toThrow(
      'El examen ya fue aceptado; realice cambios para volver a solicitar revisión.',
    );
  });

  it('rejectExam: lanza error si el examen no está en revisión', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.VALID,
      active: true,
    });

    await expect(service.rejectExam('exam-1', 'user-1')).rejects.toThrow(
      'Solo se pueden rechazar exámenes en revisión.',
    );
  });

  it('acceptExam: solo permite exámenes en revisión', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.DRAFT,
      active: true,
    });

    await expect(service.acceptExam('exam-1', 'user-1')).rejects.toThrow(
      'Solo se pueden aceptar exámenes en revisión.',
    );
  });

  it('createAutomaticExam: selecciona preguntas y arma preview con cobertura', async () => {
    const { service, questionRepo } = makeService();
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    TeacherMock.findOne.mockResolvedValue({
      get: () => ({ id: 't1', userId: 'user-1', hasRoleExaminer: true }),
    });
    questionRepo.getGroupedCounts.mockResolvedValue([
      { questionTypeId: 'qt1', difficulty: DifficultyLevelEnum.EASY, count: 5 },
      { questionTypeId: 'qt1', difficulty: DifficultyLevelEnum.HARD, count: 5 },
    ]);

    questionRepo.findRandomByFilters
      .mockResolvedValueOnce([
        {
          id: 'q1',
          difficulty: DifficultyLevelEnum.EASY,
          questionTypeId: 'qt1',
          subTopicId: null,
          topicId: 'topic1',
          body: 'Pregunta 1',
          options: [],
          response: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'q2',
          difficulty: DifficultyLevelEnum.HARD,
          questionTypeId: 'qt1',
          subTopicId: 'sub1',
          topicId: 'topic2',
          body: 'Pregunta 2',
          options: [],
          response: null,
        },
      ]);

    const preview = await service.createAutomaticExam({
      title: 'Auto',
      subjectId: 'sub-1',
      authorId: 'user-1',
      questionCount: 2,
      questionTypeCounts: [{ questionTypeId: 'qt1', count: 2 }],
      difficultyCounts: {
        [DifficultyLevelEnum.EASY]: 1,
        [DifficultyLevelEnum.MEDIUM]: 0,
        [DifficultyLevelEnum.HARD]: 1,
      },
      topicIds: ['topic1', 'topic2'],
      subtopicDistribution: [{ subtopicId: 'sub1', percentage: 50 }],
    } as any);

    expect(preview.questions).toHaveLength(2);
    expect(preview.topicCoverage).toMatchObject({
      mode: 'automatic',
      subjectId: 'sub-1',
    });
    expect(preview.topicProportion.topic1).toBeDefined();
    expect(questionRepo.findRandomByFilters).toHaveBeenCalledTimes(2);
  });

  it('requestExamReview: valida roles y asigna validador', async () => {
    const { service, examRepo, examQuestionRepo } = makeService();

    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.DRAFT,
      active: true,
    });
    TeacherMock.findOne.mockResolvedValue({
      get: () => ({
        id: 't-1',
        userId: 'user-1',
        hasRoleExaminer: true,
        hasRoleSubjectLeader: false,
      }),
    });
    SubjectMock.findByPk.mockResolvedValue({
      get: () => ({ id: 'sub-1', leadTeacherId: 'leader-1' }),
    });
    TeacherSubjectMock.findOne.mockResolvedValue({
      id: 'ts-1',
      teacherId: 't-1',
      subjectId: 'sub-1',
    });
    TeacherMock.findByPk.mockResolvedValue({
      get: () => ({
        id: 'leader-1',
        userId: 'user-2',
        hasRoleSubjectLeader: true,
        hasRoleExaminer: false,
      }),
    });
    examQuestionRepo.listByExamId.mockResolvedValue([]);

    await service.requestExamReview('exam-1', 'user-1');

    expect(examRepo.update).toHaveBeenCalledWith('exam-1', {
      examStatus: ExamStatusEnum.UNDER_REVIEW,
      validatorId: 'leader-1',
      validatedAt: null,
    });
  });

  it('acceptExam: permite a un jefe de materia aprobar con comentario', async () => {
    const { service, examRepo, examQuestionRepo } = makeService();

    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.UNDER_REVIEW,
      active: true,
    });
    TeacherMock.findOne.mockResolvedValue({
      get: () => ({
        id: 't-1',
        userId: 'user-1',
        hasRoleExaminer: false,
        hasRoleSubjectLeader: true,
      }),
    });
    SubjectMock.findByPk.mockResolvedValue({
      get: () => ({ id: 'sub-1', leadTeacherId: 't-1' }),
    });
    examQuestionRepo.listByExamId.mockResolvedValue([]);

    const result = await service.acceptExam('exam-1', 'user-1', 'Bien hecho');

    expect(examRepo.update).toHaveBeenCalledWith('exam-1', {
      examStatus: ExamStatusEnum.APPROVED,
      validatedAt: expect.any(Date),
      observations: 'Bien hecho',
    });
    expect(result.examStatus).toBe(ExamStatusEnum.UNDER_REVIEW);
  });

  it('getById: devuelve el examen con preguntas asociadas', async () => {
    const { service, examRepo, examQuestionRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue({ id: 'exam-1', subjectId: 'sub-1' });
    examQuestionRepo.listByExamId.mockResolvedValue([{ id: 'eq-1' }]);

    const detail = await service.getById('exam-1');

    expect(detail?.questions).toEqual([{ id: 'eq-1' }]);
  });

  it('requestExamReview: no permite revisar un examen publicado', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.PUBLISHED,
      active: true,
    });

    await expect(service.requestExamReview('exam-1', 'user-1')).rejects.toThrow(
      'No es posible solicitar revisión de un examen publicado.',
    );
  });

  it('rejectExam: permite rechazar exámenes en revisión', async () => {
    const { service, examRepo, examQuestionRepo } = makeService();

    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.UNDER_REVIEW,
      active: true,
    });
    TeacherMock.findOne.mockResolvedValue({
      get: () => ({
        id: 't-1',
        userId: 'user-1',
        hasRoleExaminer: false,
        hasRoleSubjectLeader: true,
      }),
    });
    SubjectMock.findByPk.mockResolvedValue({
      get: () => ({ id: 'sub-1', leadTeacherId: 't-1' }),
    });
    examQuestionRepo.listByExamId.mockResolvedValue([]);

    await service.rejectExam('exam-1', 'user-1', 'Cambios pendientes');

    expect(examRepo.update).toHaveBeenCalledWith('exam-1', {
      examStatus: ExamStatusEnum.REJECTED,
      validatedAt: expect.any(Date),
      observations: 'Cambios pendientes',
    });
  });

  it('computeTopicProportion: retorna objeto vacío cuando no hay preguntas', () => {
    const { service } = makeService();
    const proportion = (service as any).computeTopicProportion([]);
    expect(proportion).toEqual({});
  });
});
