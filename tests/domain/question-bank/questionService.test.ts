import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';

// ====== MOCKS DE MÓDULOS (NO USAMOS VARIABLES EXTERNAS DENTRO DE vi.mock) ======

vi.mock(
  '../../../app/infrastructure/exam-generation/models/ExamQuestion',
  () => ({
    __esModule: true,
    default: { count: vi.fn() },
  }),
);

vi.mock(
  '../../../app/infrastructure/question-bank/models/QuestionType',
  () => ({
    __esModule: true,
    default: { findByPk: vi.fn() },
  }),
);

vi.mock(
  '../../../app/infrastructure/question-bank/models/Subject',
  () => ({
    __esModule: true,
    default: { findAll: vi.fn() },
  }),
);

vi.mock(
  '../../../app/infrastructure/question-bank/models/SubjectTopic',
  () => ({
    __esModule: true,
    default: { findAll: vi.fn() },
  }),
);

vi.mock(
  '../../../app/infrastructure/question-bank/models/SubTopic',
  () => ({
    __esModule: true,
    default: { findByPk: vi.fn(), findAll: vi.fn() },
  }),
);

vi.mock(
  '../../../app/infrastructure/question-bank/models/TeacherSubject',
  () => ({
    __esModule: true,
    default: { findAll: vi.fn() },
  }),
);

vi.mock(
  '../../../app/infrastructure/user/models',
  () => ({
    __esModule: true,
    Teacher: { findOne: vi.fn() },
  }),
);

// Zod schemas mockeados
vi.mock(
  '../../../app/domains/question-bank/schemas/questionSchema',
  () => ({
    __esModule: true,
    questionCreateSchema: { parse: vi.fn((v: any) => v) },
    questionUpdateSchema: { parse: vi.fn((v: any) => v) },
  }),
);

// ====== IMPORTS REALES (ya usan los mocks anteriores) ======

import { QuestionService } from '../../../app/domains/question-bank/domain/services/questionService';
import { DifficultyLevelEnum } from '../../../app/domains/question-bank/entities/enums/DifficultyLevels';
import { QuestionTypeEnum } from '../../../app/domains/question-bank/entities/enums/QuestionType';

import ExamQuestionModel from '../../../app/infrastructure/exam-generation/models/ExamQuestion';
import QuestionTypeModel from '../../../app/infrastructure/question-bank/models/QuestionType';
import SubjectModel from '../../../app/infrastructure/question-bank/models/Subject';
import SubjectTopicModel from '../../../app/infrastructure/question-bank/models/SubjectTopic';
import SubtopicModel from '../../../app/infrastructure/question-bank/models/SubTopic';
import TeacherSubjectModel from '../../../app/infrastructure/question-bank/models/TeacherSubject';
import { Teacher as TeacherModel } from '../../../app/infrastructure/user/models';

// Casts a any para no pelear con tipos en tests
const ExamQuestionModelMock = ExamQuestionModel as any;
const QuestionTypeModelMock = QuestionTypeModel as any;
const SubjectModelMock = SubjectModel as any;
const SubjectTopicModelMock = SubjectTopicModel as any;
const SubtopicModelMock = SubtopicModel as any;
const TeacherSubjectModelMock = TeacherSubjectModel as any;
const TeacherModelMock = TeacherModel as any;

// ====== HELPERS PARA REPOSITORIOS MOCK ======

const makeQuestionRepo = () =>
  ({
    create: vi.fn(),
    paginateDetail: vi.fn(),
    existsByStatementAndSubtopic: vi.fn(),
    existsByStatementAndSubtopicExceptId: vi.fn(),
    get_detail_by_id: vi.fn(),
    update: vi.fn(),
    softDeleteById: vi.fn(),
    deleteHardById: vi.fn(),
  } as any);

const makeSubtopicRepo = () => ({} as any);
const makeSubjectRepo = () => ({} as any);

// ====== CONFIG GLOBAL DE ERRORES DE DOMINIO ======

beforeAll(() => {
  vi.spyOn(QuestionService.prototype as any, 'raiseBusinessRuleError')
    .mockImplementation((...args: any[]) => {
      const message = args[1] ?? 'BUSINESS_RULE_ERROR';
      throw new Error(message);
    });

  vi.spyOn(QuestionService.prototype as any, 'raiseNotFoundError')
    .mockImplementation((...args: any[]) => {
      const message = args[1] ?? 'NOT_FOUND_ERROR';
      throw new Error(message);
    });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ======================================================
// 1) validateOptionsAndResponse
// ======================================================

describe('QuestionService - validateOptionsAndResponse', () => {
  const service = new QuestionService({
    questionRepo: makeQuestionRepo(),
    subtopicRepo: makeSubtopicRepo(),
    subjectRepo: makeSubjectRepo(),
  });

  const callValidate = (
    type: QuestionTypeEnum,
    options: any,
    response: string | null | undefined,
  ) => {
    // @ts-ignore acceder al método privado
    return (service as any).validateOptionsAndResponse('test-op', type, options, response);
  };

  it('ESSAY no debe permitir options', () => {
    expect(() =>
      callValidate(
        QuestionTypeEnum.ESSAY,
        [{ text: 'X', isCorrect: true }],
        null,
      ),
    ).toThrowError('ESSAY_CANNOT_HAVE_OPTIONS');
  });

  it('MCQ requiere opciones', () => {
    expect(() =>
      callValidate(
        QuestionTypeEnum.MCQ,
        [],
        null,
      ),
    ).toThrowError('MCQ_MUST_HAVE_OPTIONS');
  });

  it('MCQ requiere al menos una opción correcta', () => {
    expect(() =>
      callValidate(
        QuestionTypeEnum.MCQ,
        [
          { text: 'A', isCorrect: false },
          { text: 'B', isCorrect: false },
        ],
        null,
      ),
    ).toThrowError('MCQ_MUST_HAVE_AT_LEAST_ONE_CORRECT');
  });

  it('TRUE_FALSE requiere opciones y valida que response sea true/false si viene', () => {
    expect(() =>
      callValidate(
        QuestionTypeEnum.TRUE_FALSE,
        [],
        null,
      ),
    ).toThrowError('TRUE_FALSE_MUST_HAVE_OPTIONS');

    expect(() =>
      callValidate(
        QuestionTypeEnum.TRUE_FALSE,
        [{ text: 'True', isCorrect: true }],
        'yes',
      ),
    ).toThrowError('TRUE_FALSE_RESPONSE_MUST_BE_TRUE_OR_FALSE');

    expect(() =>
      callValidate(
        QuestionTypeEnum.TRUE_FALSE,
        [{ text: 'True', isCorrect: true }],
        ' true ',
      ),
    ).not.toThrowError();

    expect(() =>
      callValidate(
        QuestionTypeEnum.TRUE_FALSE,
        [{ text: 'False', isCorrect: true }],
        'FALSE',
      ),
    ).not.toThrowError();
  });
});

// =======================================
// 2) create
// =======================================

describe('QuestionService - create', () => {
  const makeService = () => {
    const questionRepo = makeQuestionRepo();
    const subtopicRepo = makeSubtopicRepo();
    const subjectRepo = makeSubjectRepo();
    const service = new QuestionService({ questionRepo, subtopicRepo, subjectRepo });
    return { service, questionRepo };
  };

  it('crea una pregunta válida (happy path)', async () => {
    const { service, questionRepo } = makeService();

    vi.spyOn(service as any, 'ensureTeacherCanCreateQuestion')
      .mockResolvedValue({
        teacher: {
          id: 'teacher-1',
          userId: 'user-1',
          hasRoleSubjectLeader: false,
        },
        subjectIds: ['subject-1'],
        allowedSubjectIds: ['subject-1'],
      });

    questionRepo.existsByStatementAndSubtopic.mockResolvedValue(false);

    QuestionTypeModelMock.findByPk.mockResolvedValue({
      get: () => ({ id: 'qt-1', name: QuestionTypeEnum.MCQ }),
    });

    questionRepo.create.mockResolvedValue({
      questionId: 'q-1',
      authorId: 'teacher-1',
      subtopicId: 'subtopic-1',
      body: 'Pregunta',
      questionTypeId: 'qt-1',
      difficulty: DifficultyLevelEnum.EASY,
      options: [{ text: 'A', isCorrect: true }],
      response: null,
    } as any);

    const input: any = {
      currentUserId: 'user-1',
      body: {
        body: 'Pregunta',
        questionTypeId: 'qt-1',
        subtopicId: 'subtopic-1',
        difficulty: DifficultyLevelEnum.EASY,
        options: [{ text: 'A', isCorrect: true }],
        response: null,
      },
    };

    const result: any = await service.create(input);

    expect(questionRepo.existsByStatementAndSubtopic).toHaveBeenCalledWith(
      'Pregunta',
      'subtopic-1',
    );
    expect(QuestionTypeModelMock.findByPk).toHaveBeenCalledWith('qt-1');
    expect(questionRepo.create).toHaveBeenCalled();
    expect(result.questionId).toBe('q-1');
    expect(result.authorId).toBe('teacher-1');
  });

  it('lanza error si existe pregunta duplicada en el mismo subtema', async () => {
    const { service, questionRepo } = makeService();

    vi.spyOn(service as any, 'ensureTeacherCanCreateQuestion')
      .mockResolvedValue({
        teacher: { id: 'teacher-1', userId: 'user-1', hasRoleSubjectLeader: false },
        subjectIds: ['subject-1'],
        allowedSubjectIds: ['subject-1'],
      });

    questionRepo.existsByStatementAndSubtopic.mockResolvedValue(true);

    const input: any = {
      currentUserId: 'user-1',
      body: {
        body: 'Pregunta',
        questionTypeId: 'qt-1',
        subtopicId: 'subtopic-1',
        difficulty: DifficultyLevelEnum.EASY,
        options: [{ text: 'A', isCorrect: true }],
        response: null,
      },
    };

    await expect(service.create(input)).rejects.toThrowError(
      'QUESTION_ALREADY_EXISTS_IN_SUBTOPIC',
    );
  });

  it('lanza error si el tipo de pregunta no existe', async () => {
    const { service, questionRepo } = makeService();

    vi.spyOn(service as any, 'ensureTeacherCanCreateQuestion')
      .mockResolvedValue({
        teacher: { id: 'teacher-1', userId: 'user-1', hasRoleSubjectLeader: false },
        subjectIds: ['subject-1'],
        allowedSubjectIds: ['subject-1'],
      });

    questionRepo.existsByStatementAndSubtopic.mockResolvedValue(false);

    QuestionTypeModelMock.findByPk.mockResolvedValue(null);

    const input: any = {
      currentUserId: 'user-1',
      body: {
        body: 'Pregunta',
        questionTypeId: 'qt-1',
        subtopicId: 'subtopic-1',
        difficulty: DifficultyLevelEnum.EASY,
        options: [{ text: 'A', isCorrect: true }],
        response: null,
      },
    };

    await expect(service.create(input)).rejects.toThrowError('QUESTION_TYPE_NOT_FOUND');
  });
});

// =======================================
// 3) paginateDetail
// =======================================

describe('QuestionService - paginateDetail', () => {
  const makeService = () => {
    const questionRepo = makeQuestionRepo();
    const subtopicRepo = makeSubtopicRepo();
    const subjectRepo = makeSubjectRepo();
    const service = new QuestionService({ questionRepo, subtopicRepo, subjectRepo });
    return { service, questionRepo };
  };

  it('devuelve lista vacía si el profesor no tiene subtemas permitidos', async () => {
    const { service } = makeService();

    vi.spyOn(service as any, 'getAllowedSubtopicIdsForTeacher')
      .mockResolvedValue(new Set<string>());

    const result = await service.paginateDetail(
      { limit: 10, offset: 0 } as any,
      'user-1',
    );

    expect(result).toEqual({ list: [], total: 0 });
  });

  it('devuelve lista vacía si el subtema filtrado no está permitido', async () => {
    const { service, questionRepo } = makeService();

    vi.spyOn(service as any, 'getAllowedSubtopicIdsForTeacher')
      .mockResolvedValue(new Set<string>(['sub1']));

    const result = await service.paginateDetail(
      { limit: 10, offset: 0, subtopicId: 'sub2' } as any,
      'user-1',
    );

    expect(result).toEqual({ list: [], total: 0 });
    expect(questionRepo.paginateDetail).not.toHaveBeenCalled();
  });

  it('usa los subtemas permitidos cuando no se pasa subtopicId', async () => {
    const { service, questionRepo } = makeService();

    vi.spyOn(service as any, 'getAllowedSubtopicIdsForTeacher')
      .mockResolvedValue(new Set<string>(['sub1', 'sub2']));

    questionRepo.paginateDetail.mockResolvedValue({
      items: [{ questionId: 'q1' } as any],
      total: 1,
    });

    const result = await service.paginateDetail(
      { limit: 10, offset: 0 } as any,
      'user-1',
    );

    expect(questionRepo.paginateDetail).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      filters: {
        q: undefined,
        subtopicId: undefined,
        subtopicIds: ['sub1', 'sub2'],
        authorId: undefined,
        difficulty: undefined,
        questionTypeId: undefined,
      },
    });

    expect(result).toEqual({ list: [{ questionId: 'q1' }], total: 1 });
  });
});

// =======================================
// 4) get_detail_by_id
// =======================================

describe('QuestionService - get_detail_by_id', () => {
  const makeService = () => {
    const questionRepo = makeQuestionRepo();
    const subtopicRepo = makeSubtopicRepo();
    const subjectRepo = makeSubjectRepo();
    const service = new QuestionService({ questionRepo, subtopicRepo, subjectRepo });
    return { service, questionRepo };
  };

  it('devuelve null si la pregunta no existe', async () => {
    const { service, questionRepo } = makeService();
    questionRepo.get_detail_by_id.mockResolvedValue(null);

    const result = await service.get_detail_by_id('q-1', 'user-1');

    expect(result).toBeNull();
  });

  it('lanza error si el subtema de la pregunta no está permitido', async () => {
    const { service, questionRepo } = makeService();
    questionRepo.get_detail_by_id.mockResolvedValue({
      questionId: 'q-1',
      subtopicId: 'sub2',
    } as any);

    vi.spyOn(service as any, 'getAllowedSubtopicIdsForTeacher')
      .mockResolvedValue(new Set<string>(['sub1']));

    await expect(service.get_detail_by_id('q-1', 'user-1'))
      .rejects.toThrowError('QUESTION_VIEW_FORBIDDEN');
  });

  it('devuelve la pregunta si el subtema está permitido', async () => {
    const { service, questionRepo } = makeService();
    const question = { questionId: 'q-1', subtopicId: 'sub1' } as any;
    questionRepo.get_detail_by_id.mockResolvedValue(question);

    vi.spyOn(service as any, 'getAllowedSubtopicIdsForTeacher')
      .mockResolvedValue(new Set<string>(['sub1', 'sub2']));

    const result = await service.get_detail_by_id('q-1', 'user-1');

    expect(result).toBe(question);
  });
});

// =======================================
// 5) update
// =======================================

describe('QuestionService - update', () => {
  const makeService = () => {
    const questionRepo = makeQuestionRepo();
    const subtopicRepo = makeSubtopicRepo();
    const subjectRepo = makeSubjectRepo();
    const service = new QuestionService({ questionRepo, subtopicRepo, subjectRepo });
    return { service, questionRepo };
  };

  it('lanza error si la pregunta no existe', async () => {
    const { service, questionRepo } = makeService();
    questionRepo.get_detail_by_id.mockResolvedValue(null);

    await expect(
      service.update({
        questionId: 'q-1',
        patch: {} as any,
        currentUserId: 'user-1',
      }),
    ).rejects.toThrowError('QUESTION_NOT_FOUND');
  });

  it('si la pregunta fue usada en exámenes, crea una nueva y hace soft delete de la original', async () => {
    const { service, questionRepo } = makeService();

    const current = {
      questionId: 'q-1',
      authorId: 'teacher-1',
      body: 'Pregunta original',
      subtopicId: 'sub1',
      difficulty: DifficultyLevelEnum.EASY,
      questionTypeId: 'qt-1',
      options: [{ text: 'A', isCorrect: true }],
      response: null,
    } as any;

    questionRepo.get_detail_by_id.mockResolvedValue(current);

    vi.spyOn(service as any, 'ensureTeacherCanManageQuestion')
      .mockResolvedValue({
        teacher: { id: 'teacher-1', userId: 'user-1', hasRoleSubjectLeader: false },
        allowedSubjectIds: ['subject-1'],
      });

    vi.spyOn(service as any, 'isQuestionUsedInAnyExam')
      .mockResolvedValue(true);

    questionRepo.existsByStatementAndSubtopicExceptId.mockResolvedValue(false);

    vi.spyOn(service as any, 'ensureTeacherCanCreateQuestion')
      .mockResolvedValue({
        teacher: { id: 'teacher-1', userId: 'user-1', hasRoleSubjectLeader: false },
        subjectIds: ['subject-1'],
        allowedSubjectIds: ['subject-1'],
      });

    QuestionTypeModelMock.findByPk.mockResolvedValue({
      get: () => ({ id: 'qt-1', name: QuestionTypeEnum.MCQ }),
    });

    const created = {
      questionId: 'q-2',
      authorId: 'teacher-1',
      body: 'Pregunta modificada',
      subtopicId: 'sub1',
    } as any;
    questionRepo.create.mockResolvedValue(created);

    const result: any = await service.update({
      questionId: 'q-1',
      patch: { body: 'Pregunta modificada' } as any,
      currentUserId: 'user-1',
    });

    expect(questionRepo.create).toHaveBeenCalled();
    expect(questionRepo.softDeleteById).toHaveBeenCalledWith('q-1');
    expect(result.questionId).toBe('q-2');
  });

  it('si la pregunta NO fue usada en exámenes, se actualiza in-place', async () => {
    const { service, questionRepo } = makeService();

    const current = {
      questionId: 'q-1',
      authorId: 'teacher-1',
      body: 'Pregunta original',
      subtopicId: 'sub1',
      difficulty: DifficultyLevelEnum.EASY,
      questionTypeId: 'qt-1',
      options: [{ text: 'A', isCorrect: true }],
      response: null,
    } as any;

    questionRepo.get_detail_by_id.mockResolvedValue(current);

    vi.spyOn(service as any, 'ensureTeacherCanManageQuestion')
      .mockResolvedValue({
        teacher: { id: 'teacher-1', userId: 'user-1', hasRoleSubjectLeader: false },
        allowedSubjectIds: ['subject-1'],
      });

    vi.spyOn(service as any, 'isQuestionUsedInAnyExam')
      .mockResolvedValue(false);

    questionRepo.existsByStatementAndSubtopicExceptId.mockResolvedValue(false);

    QuestionTypeModelMock.findByPk.mockResolvedValue({
      get: () => ({ id: 'qt-1', name: QuestionTypeEnum.MCQ }),
    });

    const updated = {
      questionId: 'q-1',
      authorId: 'teacher-1',
      body: 'Pregunta modificada',
      subtopicId: 'sub1',
    } as any;
    questionRepo.update.mockResolvedValue(updated);

    const result: any = await service.update({
      questionId: 'q-1',
      patch: { body: 'Pregunta modificada' } as any,
      currentUserId: 'user-1',
    });

    expect(questionRepo.update).toHaveBeenCalled();
    expect(questionRepo.softDeleteById).not.toHaveBeenCalled();
    expect(result.body).toBe('Pregunta modificada');
  });

  it('lanza error si hay duplicado (body+subtema) al actualizar', async () => {
    const { service, questionRepo } = makeService();

    const current = {
      questionId: 'q-1',
      authorId: 'teacher-1',
      body: 'Pregunta original',
      subtopicId: 'sub1',
      difficulty: DifficultyLevelEnum.EASY,
      questionTypeId: 'qt-1',
      options: [{ text: 'A', isCorrect: true }],
      response: null,
    } as any;

    questionRepo.get_detail_by_id.mockResolvedValue(current);

    vi.spyOn(service as any, 'ensureTeacherCanManageQuestion')
      .mockResolvedValue({
        teacher: { id: 'teacher-1', userId: 'user-1', hasRoleSubjectLeader: false },
        allowedSubjectIds: ['subject-1'],
      });

    vi.spyOn(service as any, 'isQuestionUsedInAnyExam')
      .mockResolvedValue(false);

    questionRepo.existsByStatementAndSubtopicExceptId.mockResolvedValue(true);

    await expect(
      service.update({
        questionId: 'q-1',
        patch: { body: 'Otra pregunta', subtopicId: 'sub1' } as any,
        currentUserId: 'user-1',
      }),
    ).rejects.toThrowError('QUESTION_ALREADY_EXISTS_IN_SUBTOPIC');
  });

  it('lanza error si repo.update devuelve null (no encontrada después de update)', async () => {
    const { service, questionRepo } = makeService();

    const current = {
      questionId: 'q-1',
      authorId: 'teacher-1',
      body: 'Pregunta original',
      subtopicId: 'sub1',
      difficulty: DifficultyLevelEnum.EASY,
      questionTypeId: 'qt-1',
      options: [{ text: 'A', isCorrect: true }],
      response: null,
    } as any;

    questionRepo.get_detail_by_id.mockResolvedValue(current);

    vi.spyOn(service as any, 'ensureTeacherCanManageQuestion')
      .mockResolvedValue({
        teacher: { id: 'teacher-1', userId: 'user-1', hasRoleSubjectLeader: false },
        allowedSubjectIds: ['subject-1'],
      });

    vi.spyOn(service as any, 'isQuestionUsedInAnyExam')
      .mockResolvedValue(false);

    questionRepo.existsByStatementAndSubtopicExceptId.mockResolvedValue(false);

    QuestionTypeModelMock.findByPk.mockResolvedValue({
      get: () => ({ id: 'qt-1', name: QuestionTypeEnum.MCQ }),
    });

    questionRepo.update.mockResolvedValue(null);

    await expect(
      service.update({
        questionId: 'q-1',
        patch: { body: 'Pregunta modificada' } as any,
        currentUserId: 'user-1',
      }),
    ).rejects.toThrowError('QUESTION_NOT_FOUND_AFTER_UPDATE');
  });
});

// =======================================
// 6) deleteById
// =======================================

describe('QuestionService - deleteById', () => {
  const makeService = () => {
    const questionRepo = makeQuestionRepo();
    const subtopicRepo = makeSubtopicRepo();
    const subjectRepo = makeSubjectRepo();
    const service = new QuestionService({ questionRepo, subtopicRepo, subjectRepo });
    return { service, questionRepo };
  };

  it('lanza error si la pregunta no existe', async () => {
    const { service, questionRepo } = makeService();
    questionRepo.get_detail_by_id.mockResolvedValue(null);

    await expect(
      service.deleteById({ questionId: 'q-1', currentUserId: 'user-1' }),
    ).rejects.toThrowError('QUESTION_NOT_FOUND');
  });

  it('si la pregunta fue usada en exámenes, hace soft delete', async () => {
    const { service, questionRepo } = makeService();

    questionRepo.get_detail_by_id.mockResolvedValue({
      questionId: 'q-1',
      authorId: 'teacher-1',
      subtopicId: 'sub1',
    } as any);

    vi.spyOn(service as any, 'ensureTeacherCanManageQuestion')
      .mockResolvedValue({
        teacher: { id: 'teacher-1', userId: 'user-1', hasRoleSubjectLeader: false },
        allowedSubjectIds: ['subject-1'],
      });

    vi.spyOn(service as any, 'isQuestionUsedInAnyExam')
      .mockResolvedValue(true);

    questionRepo.softDeleteById.mockResolvedValue(true);

    const result = await service.deleteById({
      questionId: 'q-1',
      currentUserId: 'user-1',
    });

    expect(questionRepo.softDeleteById).toHaveBeenCalledWith('q-1');
    expect(questionRepo.deleteHardById).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('si la pregunta NO fue usada en exámenes, hace delete hard', async () => {
    const { service, questionRepo } = makeService();

    questionRepo.get_detail_by_id.mockResolvedValue({
      questionId: 'q-1',
      authorId: 'teacher-1',
      subtopicId: 'sub1',
    } as any);

    vi.spyOn(service as any, 'ensureTeacherCanManageQuestion')
      .mockResolvedValue({
        teacher: { id: 'teacher-1', userId: 'user-1', hasRoleSubjectLeader: false },
        allowedSubjectIds: ['subject-1'],
      });

    vi.spyOn(service as any, 'isQuestionUsedInAnyExam')
      .mockResolvedValue(false);

    questionRepo.deleteHardById.mockResolvedValue(true);

    const result = await service.deleteById({
      questionId: 'q-1',
      currentUserId: 'user-1',
    });

    expect(questionRepo.deleteHardById).toHaveBeenCalledWith('q-1');
    expect(questionRepo.softDeleteById).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });
});

// =======================================
// 7) Casos de permisos en create (helpers internos)
// =======================================

describe('QuestionService - permisos en create (helpers internos)', () => {
  const makeService = () => {
    const questionRepo = makeQuestionRepo();
    const subtopicRepo = makeSubtopicRepo();
    const subjectRepo = makeSubjectRepo();
    const service = new QuestionService({ questionRepo, subtopicRepo, subjectRepo });
    return { service, questionRepo, subtopicRepo, subjectRepo };
  };

  const baseBody: any = {
    body: 'Pregunta de prueba',
    questionTypeId: 'qt-1',
    subtopicId: 'sub-1',
    difficulty: DifficultyLevelEnum.EASY,
    options: [{ text: 'A', isCorrect: true }],
    response: null,
  };

  it('lanza TEACHER_PROFILE_NOT_FOUND si no existe perfil de profesor para el usuario', async () => {
    const { service } = makeService();

    // getTeacherByUserId → Teacher.findOne devuelve null
    TeacherModelMock.findOne.mockResolvedValue(null);

    const input = {
      currentUserId: 'user-1',
      body: baseBody,
    };

    await expect(service.create(input as any))
      .rejects.toThrowError('TEACHER_PROFILE_NOT_FOUND');

    expect(TeacherModelMock.findOne).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
  });

  it('lanza SUBTOPIC_WITHOUT_SUBJECT si el subtema no tiene asignaturas asociadas', async () => {
    const { service } = makeService();

    // Profesor existe
    TeacherModelMock.findOne.mockResolvedValue({
      get: () => ({
        id: 'teacher-1',
        userId: 'user-1',
        hasRoleSubjectLeader: false,
      }),
    });

    // Subtema existe
    SubtopicModelMock.findByPk.mockResolvedValue({
      get: () => ({
        id: 'sub-1',
        topicId: 'topic-1',
      }),
    });

    // No hay SubjectTopic asociados → subjectIds = []
    SubjectTopicModelMock.findAll.mockResolvedValue([]);

    const input = {
      currentUserId: 'user-1',
      body: baseBody,
    };

    await expect(service.create(input as any))
      .rejects.toThrowError('SUBTOPIC_WITHOUT_SUBJECT');
  });

  it('lanza TEACHER_NOT_ASSIGNED_TO_SUBJECT si el profesor no está en ninguna asignatura del subtema', async () => {
    const { service } = makeService();

    // Profesor existe
    TeacherModelMock.findOne.mockResolvedValue({
      get: () => ({
        id: 'teacher-1',
        userId: 'user-1',
        hasRoleSubjectLeader: false,
      }),
    });

    // Subtema → topicId
    SubtopicModelMock.findByPk.mockResolvedValue({
      get: () => ({
        id: 'sub-1',
        topicId: 'topic-1',
      }),
    });

    // Subtema asociado a una asignatura subject-1
    SubjectTopicModelMock.findAll.mockResolvedValue([
      {
        get: () => ({
          subjectId: 'subject-1',
          topicId: 'topic-1',
        }),
      },
    ]);

    // Profesor no imparte ninguna de esas asignaturas (lista vacía)
    TeacherSubjectModelMock.findAll.mockResolvedValue([]);

    const input = {
      currentUserId: 'user-1',
      body: baseBody,
    };

    await expect(service.create(input as any))
      .rejects.toThrowError('TEACHER_NOT_ASSIGNED_TO_SUBJECT');
  });
});


// =======================================
// 8) Helpers internos adicionales
// =======================================

describe('QuestionService - helpers internos adicionales', () => {
  const makeService = () => {
    const questionRepo = makeQuestionRepo();
    const subtopicRepo = makeSubtopicRepo();
    const subjectRepo = makeSubjectRepo();
    const service = new QuestionService({ questionRepo, subtopicRepo, subjectRepo });
    return { service };
  };

  it('getSubjectIdsForSubtopic devuelve los subjectIds asociados a un subtema', async () => {
    const { service } = makeService();

    SubtopicModelMock.findByPk.mockResolvedValue({
      get: () => ({ id: 'sub-1', topicId: 'topic-1' }),
    });

    SubjectTopicModelMock.findAll.mockResolvedValue([
      {
        get: () => ({ subjectId: 'subject-1', topicId: 'topic-1' }),
      },
      {
        get: () => ({ subjectId: 'subject-2', topicId: 'topic-1' }),
      },
    ]);

    // @ts-ignore método privado
    const ids: string[] = await (service as any).getSubjectIdsForSubtopic(
      'test-op',
      'sub-1',
    );

    expect(SubtopicModelMock.findByPk).toHaveBeenCalledWith('sub-1');
    expect(SubjectTopicModelMock.findAll).toHaveBeenCalledWith({
      where: { topicId: 'topic-1' },
    });
    expect(ids).toEqual(['subject-1', 'subject-2']);
  });

  it('getSubjectIdsForSubtopic lanza error si el subtema no existe', async () => {
    const { service } = makeService();

    SubtopicModelMock.findByPk.mockResolvedValue(null);

    await expect(
      // @ts-ignore método privado
      (service as any).getSubjectIdsForSubtopic('test-op', 'sub-1'),
    ).rejects.toThrow('SUBTOPIC_NOT_FOUND');
  });

  it('getTeacherSubjectIds devuelve los subjectIds del profesor', async () => {
    const { service } = makeService();

    TeacherSubjectModelMock.findAll.mockResolvedValue([
      {
        get: () => ({ teacherId: 'teacher-1', subjectId: 'subject-1' }),
      },
      {
        get: () => ({ teacherId: 'teacher-1', subjectId: 'subject-2' }),
      },
    ]);

    // @ts-ignore método privado
    const ids: string[] = await (service as any).getTeacherSubjectIds('teacher-1');

    expect(TeacherSubjectModelMock.findAll).toHaveBeenCalledWith({
      where: { teacherId: 'teacher-1' },
    });
    expect(ids).toEqual(['subject-1', 'subject-2']);
  });

  it('getAllowedSubtopicIdsForTeacher devuelve conjunto vacío si el profesor no tiene asignaturas', async () => {
    const { service } = makeService();

    // Profesor existente pero sin asignaturas
    TeacherModelMock.findOne.mockResolvedValue({
      get: () => ({
        id: 'teacher-1',
        userId: 'user-1',
        hasRoleSubjectLeader: false,
      }),
    });
    TeacherSubjectModelMock.findAll.mockResolvedValue([]);

    // @ts-ignore método privado
    const result: Set<string> = await (service as any).getAllowedSubtopicIdsForTeacher(
      'list-questions',
      'user-1',
    );

    expect(result.size).toBe(0);
  });

  it('getAllowedSubtopicIdsForTeacher devuelve los subtemas permitidos cuando hay datos', async () => {
    const { service } = makeService();

    TeacherModelMock.findOne.mockResolvedValue({
      get: () => ({
        id: 'teacher-1',
        userId: 'user-1',
        hasRoleSubjectLeader: false,
      }),
    });

    // Profesor imparte subject-1 y subject-2
    TeacherSubjectModelMock.findAll.mockResolvedValue([
      { get: () => ({ teacherId: 'teacher-1', subjectId: 'subject-1' }) },
      { get: () => ({ teacherId: 'teacher-1', subjectId: 'subject-2' }) },
    ]);

    // Estos subjectIds se mapean a topics topic-1 y topic-2
    SubjectTopicModelMock.findAll.mockResolvedValue([
      { get: () => ({ subjectId: 'subject-1', topicId: 'topic-1' }) },
      { get: () => ({ subjectId: 'subject-2', topicId: 'topic-2' }) },
    ]);

    // Y esos topics tienen subtemas sub-1 y sub-2
    SubtopicModelMock.findAll.mockResolvedValue([
      { get: () => ({ id: 'sub-1', topicId: 'topic-1' }) },
      { get: () => ({ id: 'sub-2', topicId: 'topic-2' }) },
    ]);

    // @ts-ignore método privado
    const result: Set<string> = await (service as any).getAllowedSubtopicIdsForTeacher(
      'list-questions',
      'user-1',
    );

    expect(result.has('sub-1')).toBe(true);
    expect(result.has('sub-2')).toBe(true);
    expect(result.size).toBe(2);
  });

  it('ensureTeacherCanManageQuestion lanza error si el profesor no está asignado a ninguna asignatura del subtema', async () => {
    const { service } = makeService();

    // Profesor existe
    TeacherModelMock.findOne.mockResolvedValue({
      get: () => ({
        id: 'teacher-1',
        userId: 'user-1',
        hasRoleSubjectLeader: false,
      }),
    });

    // Subtema → topic-1 → subject-1
    SubtopicModelMock.findByPk.mockResolvedValue({
      get: () => ({ id: 'sub-1', topicId: 'topic-1' }),
    });
    SubjectTopicModelMock.findAll.mockResolvedValue([
      { get: () => ({ subjectId: 'subject-1', topicId: 'topic-1' }) },
    ]);

    // Profesor no imparte ninguna de esas asignaturas
    TeacherSubjectModelMock.findAll.mockResolvedValue([]);

    const question = {
      subtopicId: 'sub-1',
      authorId: 'other-teacher',
    } as any;

    await expect(
      // @ts-ignore método privado
      (service as any).ensureTeacherCanManageQuestion(
        'update-question',
        'user-1',
        question,
      ),
    ).rejects.toThrow('TEACHER_NOT_ASSIGNED_TO_SUBJECT');
  });

  it('ensureTeacherCanManageQuestion permite gestión si el profesor es autor', async () => {
    const { service } = makeService();

    // Profesor existe
    TeacherModelMock.findOne.mockResolvedValue({
      get: () => ({
        id: 'teacher-1',
        userId: 'user-1',
        hasRoleSubjectLeader: false,
      }),
    });

    // Subtema / asignatura
    SubtopicModelMock.findByPk.mockResolvedValue({
      get: () => ({ id: 'sub-1', topicId: 'topic-1' }),
    });
    SubjectTopicModelMock.findAll.mockResolvedValue([
      { get: () => ({ subjectId: 'subject-1', topicId: 'topic-1' }) },
    ]);

    // Profesor imparte subject-1
    TeacherSubjectModelMock.findAll.mockResolvedValue([
      { get: () => ({ teacherId: 'teacher-1', subjectId: 'subject-1' }) },
    ]);

    const question = {
      subtopicId: 'sub-1',
      authorId: 'teacher-1',
    } as any;

    // @ts-ignore
    const result = await (service as any).ensureTeacherCanManageQuestion(
      'update-question',
      'user-1',
      question,
    );

    expect(result.allowedSubjectIds).toEqual(['subject-1']);
    expect(result.teacher.id).toBe('teacher-1');
  });

  it('isQuestionUsedInAnyExam devuelve true cuando count > 0 y false cuando count = 0', async () => {
    const { service } = makeService();

    ExamQuestionModelMock.count.mockResolvedValueOnce(3).mockResolvedValueOnce(0);

    // @ts-ignore método privado
    const used1 = await (service as any).isQuestionUsedInAnyExam('q-1');
    // @ts-ignore
    const used2 = await (service as any).isQuestionUsedInAnyExam('q-2');

    expect(ExamQuestionModelMock.count).toHaveBeenCalledWith({ where: { questionId: 'q-1' } });
    expect(ExamQuestionModelMock.count).toHaveBeenCalledWith({ where: { questionId: 'q-2' } });
    expect(used1).toBe(true);
    expect(used2).toBe(false);
  });
});
