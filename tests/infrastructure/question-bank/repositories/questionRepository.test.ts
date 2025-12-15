import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ModelStatic } from 'sequelize';
import { Op } from 'sequelize';

import { QuestionRepository } from '../../../../app/infrastructure/question-bank/repositories/QuestionRepository';
import type QuestionModel from '../../../../app/infrastructure/question-bank/models/Question';
import Subtopic from '../../../../app/infrastructure/question-bank/models/SubTopic';
import SubjectTopic from '../../../../app/infrastructure/question-bank/models/SubjectTopic';
import { DifficultyLevelEnum } from '../../../../app/domains/question-bank/entities/enums/DifficultyLevels';

vi.mock(
  '../../../../app/core/dependencies/dependencies',
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

type QuestionModelStatic = ModelStatic<QuestionModel>;

describe('QuestionRepository (infra, unitario)', () => {
  let mockModel: QuestionModelStatic;
  let repo: QuestionRepository;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    mockModel = {
      name: 'Question',
      findAndCountAll: vi.fn(),
      findOne: vi.fn(),
      findByPk: vi.fn(),
      destroy: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findAll: vi.fn(),
    } as unknown as QuestionModelStatic;

    repo = new QuestionRepository(mockModel);
  });

  // ---------- paginateDetail ----------
  it('paginateDetail: construye where según filtros y delega en findAndCountAll', async () => {
    const criteria: any = {
      limit: 10,
      offset: 5,
      filters: {
        q: 'sistema',
        subtopicIds: ['sub-1', 'sub-2'],
        authorId: 'author-1',
        difficulty: DifficultyLevelEnum.EASY,
        questionTypeId: 'qt-1',
      },
    };

    const rows = [{} as QuestionModel, {} as QuestionModel];
    (mockModel.findAndCountAll as any).mockResolvedValue({ rows, count: 2 });

    const toReadSpy = vi
        .spyOn(repo as any, 'toReadFn')
        .mockReturnValue({} as any);

    const result = await repo.paginateDetail(criteria);

    expect(mockModel.findAndCountAll).toHaveBeenCalledTimes(1);
    const callArgs = (mockModel.findAndCountAll as any).mock.calls[0][0];

    // where debe incluir active=true y todos los filtros
    expect(callArgs.where.active).toBe(true);
    expect(callArgs.where.body).toEqual({ [Op.like]: '%sistema%' });
    expect(callArgs.where.subTopicId).toEqual({ [Op.in]: ['sub-1', 'sub-2'] });
    expect(callArgs.where.authorId).toBe('author-1');
    expect(callArgs.where.difficulty).toBe(DifficultyLevelEnum.EASY);
    expect(callArgs.where.questionTypeId).toBe('qt-1');

    expect(callArgs.limit).toBe(10);
    expect(callArgs.offset).toBe(5);
    expect(callArgs.order).toEqual([['createdAt', 'DESC']]);

    // mapeo con toReadFn
    expect(toReadSpy).toHaveBeenCalledTimes(2);
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
  });

  it('paginateDetail: ante error delega en raiseError', async () => {
    const criteria: any = { limit: 10, offset: 0 };
    const dbError = new Error('DB error');

    (mockModel.findAndCountAll as any).mockRejectedValue(dbError);

    const handled = { items: [], total: 0 };
    const raiseErrorSpy = vi
      .spyOn(repo as any, 'raiseError')
      .mockReturnValue(handled as any);

    const result = await repo.paginateDetail(criteria);

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(handled);
  });

  // ---------- get_detail_by_id ----------
  it('get_detail_by_id: devuelve null si no encuentra registro activo', async () => {
    (mockModel.findOne as any).mockResolvedValue(null);

    const result = await repo.get_detail_by_id('q-1');

    expect(mockModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'q-1', active: true },
        transaction: undefined,
      }),
    );
    expect(result).toBeNull();
  });

  it('get_detail_by_id: cuando includeInactive=true no filtra por active', async () => {
    (mockModel.findOne as any).mockResolvedValue(null);

    await repo.get_detail_by_id('q-1', true);

    expect(mockModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'q-1' },
        transaction: undefined,
      }),
    );
  });

  it('get_detail_by_id: mapea a QuestionDetail cuando encuentra registro', async () => {
    const row = {} as QuestionModel;
    (mockModel.findOne as any).mockResolvedValue(row);

    const detail = { questionId: 'q-1' } as any;
    const toReadSpy = vi.spyOn(repo as any, 'toReadFn').mockReturnValue(detail);

    const result = await repo.get_detail_by_id('q-1');

    expect(mockModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'q-1', active: true },
        transaction: undefined,
      }),
    );
    expect(toReadSpy).toHaveBeenCalledWith(row);
    expect(result).toBe(detail);
  });

  it('get_detail_by_id: ante error delega en raiseError', async () => {
    const dbError = new Error('DB error');
    (mockModel.findOne as any).mockRejectedValue(dbError);

    const handled = { questionId: 'handled' } as any;
    const raiseErrorSpy = vi
      .spyOn(repo as any, 'raiseError')
      .mockReturnValue(handled);

    const result = await repo.get_detail_by_id('q-1');

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(handled);
  });

  // ---------- update ----------
  it('update: devuelve null si no encuentra la pregunta', async () => {
    (mockModel.findByPk as any).mockResolvedValue(null);

    const patch: any = { body: 'nueva' };
    const result = await repo.update('q-1', patch);

    expect(mockModel.findByPk).toHaveBeenCalledWith('q-1', {
      transaction: undefined,
    });
    expect(result).toBeNull();
  });

  it('update: si toUpdateAttrsFn devuelve objeto vacío, no actualiza y devuelve toReadFn(row)', async () => {
    const row: any = {
      update: vi.fn(),
    };

    (mockModel.findByPk as any).mockResolvedValue(row);

    const toUpdateSpy = vi
      .spyOn(repo as any, 'toUpdateAttrsFn')
      .mockReturnValue({});

    const detail = { questionId: 'q-1', body: 'original' } as any;
    const toReadSpy = vi
      .spyOn(repo as any, 'toReadFn')
      .mockReturnValue(detail);

    const patch: any = { body: 'nueva' };
    const result = await repo.update('q-1', patch);

    expect(toUpdateSpy).toHaveBeenCalledWith(patch);
    expect(row.update).not.toHaveBeenCalled();
    expect(toReadSpy).toHaveBeenCalledWith(row);
    expect(result).toBe(detail);
  });

  it('update: aplica patch cuando hay attrs, actualiza fila y devuelve toReadFn(row)', async () => {
    const row: any = {
      update: vi.fn().mockResolvedValue(undefined),
    };

    (mockModel.findByPk as any).mockResolvedValue(row);

    const attrs = { body: 'nueva', difficulty: DifficultyLevelEnum.MEDIUM };
    const toUpdateSpy = vi
      .spyOn(repo as any, 'toUpdateAttrsFn')
      .mockReturnValue(attrs);

    const detail = { questionId: 'q-1', body: 'nueva' } as any;
    const toReadSpy = vi
      .spyOn(repo as any, 'toReadFn')
      .mockReturnValue(detail);

    const patch: any = { body: 'nueva', difficulty: DifficultyLevelEnum.MEDIUM };
    const result = await repo.update('q-1', patch);

    expect(toUpdateSpy).toHaveBeenCalledWith(patch);
    expect(row.update).toHaveBeenCalledWith(attrs, {
      transaction: undefined,
    });
    expect(toReadSpy).toHaveBeenCalledWith(row);
    expect(result).toBe(detail);
  });

  it('update: ante error delega en raiseError', async () => {
    const dbError = new Error('DB error');
    (mockModel.findByPk as any).mockRejectedValue(dbError);

    const handled = { questionId: 'handled' } as any;
    const raiseErrorSpy = vi
      .spyOn(repo as any, 'raiseError')
      .mockReturnValue(handled);

    const patch: any = { body: 'nueva' };
    const result = await repo.update('q-1', patch);

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(handled);
  });

  // ---------- deleteHardById ----------
  it('deleteHardById: devuelve true cuando destroy > 0', async () => {
    (mockModel.destroy as any).mockResolvedValue(1);

    const result = await repo.deleteHardById('q-1');

    expect(mockModel.destroy).toHaveBeenCalledWith({
      where: { id: 'q-1' },
      transaction: undefined,
    });
    expect(result).toBe(true);
  });

  it('deleteHardById: devuelve false cuando destroy = 0', async () => {
    (mockModel.destroy as any).mockResolvedValue(0);

    const result = await repo.deleteHardById('q-1');

    expect(result).toBe(false);
  });

  it('deleteHardById: ante error delega en raiseError', async () => {
    const dbError = new Error('DB error');
    (mockModel.destroy as any).mockRejectedValue(dbError);

    const handled = false;
    const raiseErrorSpy = vi
      .spyOn(repo as any, 'raiseError')
      .mockReturnValue(handled);

    const result = await repo.deleteHardById('q-1');

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(handled);
  });

  // ---------- softDeleteById ----------
  it('softDeleteById: devuelve true cuando update afecta filas', async () => {
    (mockModel.update as any).mockResolvedValue([1]);

    const result = await repo.softDeleteById('q-1');

    expect(mockModel.update).toHaveBeenCalledWith(
      { active: false },
      { where: { id: 'q-1' }, transaction: undefined },
    );
    expect(result).toBe(true);
  });

  it('softDeleteById: devuelve false cuando update no afecta filas', async () => {
    (mockModel.update as any).mockResolvedValue([0]);

    const result = await repo.softDeleteById('q-1');

    expect(result).toBe(false);
  });

  it('softDeleteById: ante error delega en raiseError', async () => {
    const dbError = new Error('DB error');
    (mockModel.update as any).mockRejectedValue(dbError);

    const handled = false;
    const raiseErrorSpy = vi
      .spyOn(repo as any, 'raiseError')
      .mockReturnValue(handled);

    const result = await repo.softDeleteById('q-1');

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(handled);
  });

  // ---------- existsByStatementAndSubtopic ----------
  it('existsByStatementAndSubtopic: hace count por body + subTopicId + active', async () => {
    (mockModel.count as any).mockResolvedValue(2);

    const result = await repo.existsByStatementAndSubtopic('texto', 'sub-1');

    expect(mockModel.count).toHaveBeenCalledWith({
      where: {
        body: 'texto',
        subTopicId: 'sub-1',
        active: true,
      },
      transaction: undefined,
    });
    expect(result).toBe(true);
  });

  it('existsByStatementAndSubtopic: ante error delega en raiseError', async () => {
    const dbError = new Error('DB error');
    (mockModel.count as any).mockRejectedValue(dbError);

    const handled = false;
    const raiseErrorSpy = vi
      .spyOn(repo as any, 'raiseError')
      .mockReturnValue(handled);

    const result = await repo.existsByStatementAndSubtopic('texto', 'sub-1');

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(handled);
  });

  // ---------- existsByStatementAndSubtopicExceptId ----------
  it('existsByStatementAndSubtopicExceptId: usa body + subTopicId + active + id != exclude', async () => {
    (mockModel.count as any).mockResolvedValue(1);

    const result = await repo.existsByStatementAndSubtopicExceptId(
      'texto',
      'sub-1',
      'q-1',
    );

    const args = (mockModel.count as any).mock.calls[0][0];

    expect(args.where.body).toBe('texto');
    expect(args.where.subTopicId).toBe('sub-1');
    expect(args.where.active).toBe(true);
    expect(args.where.id).toEqual({ [Op.ne]: 'q-1' });
    expect(result).toBe(true);
  });

  it('existsByStatementAndSubtopicExceptId: ante error delega en raiseError', async () => {
    const dbError = new Error('DB error');
    (mockModel.count as any).mockRejectedValue(dbError);

    const handled = false;
    const raiseErrorSpy = vi
      .spyOn(repo as any, 'raiseError')
      .mockReturnValue(handled);

    const result = await repo.existsByStatementAndSubtopicExceptId(
      'texto',
      'sub-1',
      'q-1',
    );

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(handled);
  });

  // ---------- findByIds ----------
  it('findByIds: si ids está vacío devuelve [] y no llama a findAll', async () => {
    const result = await repo.findByIds([]);

    expect(mockModel.findAll).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('findByIds: construye include con primarySubtopic y mapea a QuestionForExam', async () => {
    const rows = [{} as QuestionModel];
    (mockModel.findAll as any).mockResolvedValue(rows);

    const toExamSpy = vi
      .spyOn(QuestionRepository as any, 'toQuestionForExam')
      .mockReturnValue({ id: 'q-1' } as any);

    const result = await repo.findByIds(['q-1', 'q-2']);

    expect(mockModel.findAll).toHaveBeenCalledTimes(1);
    const args = (mockModel.findAll as any).mock.calls[0][0];

    expect(args.where).toEqual({ id: { [Op.in]: ['q-1', 'q-2'] } });
    expect(args.include).toHaveLength(1);
    expect(args.include[0]).toMatchObject({
      model: Subtopic,
      as: 'primarySubtopic',
      attributes: ['id', 'topicId'],
      required: false,
    });

    expect(toExamSpy).toHaveBeenCalledWith(rows[0]);
    expect(result).toEqual([{ id: 'q-1' }]);
  });

  it('findByIds: ante error delega en raiseError', async () => {
    const dbError = new Error('DB error');
    (mockModel.findAll as any).mockRejectedValue(dbError);

    const handled = [] as any[];
    const raiseErrorSpy = vi
      .spyOn(repo as any, 'raiseError')
      .mockReturnValue(handled);

    const result = await repo.findByIds(['q-1']);

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(handled);
  });

  // ---------- findRandomByFilters ----------
  it('findRandomByFilters: construye where según filtros básicos y usa random + limit', async () => {
    const criteria: any = {
      difficulty: DifficultyLevelEnum.EASY,
      questionTypeIds: ['qt-1', 'qt-2'],
      subtopicIds: ['sub-1'],
      ids: ['q-1', 'q-2'],
      excludeQuestionIds: ['q-3'],
      limit: 5,
    };

    const rows = [{} as QuestionModel, {} as QuestionModel];
    (mockModel.findAll as any).mockResolvedValue(rows);

    const toExamSpy = vi
      .spyOn(QuestionRepository as any, 'toQuestionForExam')
      .mockReturnValue({ id: 'q-x' } as any);

    const result = await repo.findRandomByFilters(criteria);

    expect(mockModel.findAll).toHaveBeenCalledTimes(1);
    const args = (mockModel.findAll as any).mock.calls[0][0];

    const where = args.where;
    expect(where.difficulty).toBe(DifficultyLevelEnum.EASY);
    expect(where.questionTypeId).toEqual({ [Op.in]: ['qt-1', 'qt-2'] });
    expect(where.subTopicId).toEqual({ [Op.in]: ['sub-1'] });
    expect(where.id).toEqual({
      [Op.in]: ['q-1', 'q-2'],
      [Op.notIn]: ['q-3'],
    });

    expect(args.include).toHaveLength(1);
    expect(args.limit).toBe(5);
    expect(toExamSpy).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it('findRandomByFilters: con subjectId filtra topicIds por SubjectTopic y si no hay temas permitidos devuelve []', async () => {
    const criteria: any = {
      subjectId: 'subject-1',
      topicIds: ['topic-allowed', 'topic-denied'],
      limit: 10,
    };

    // ningún topic vinculado al subject → debe devolver []
    vi.spyOn(SubjectTopic, 'findAll').mockResolvedValue([]);

    const result = await repo.findRandomByFilters(criteria);

    expect(SubjectTopic.findAll).toHaveBeenCalledWith({
      attributes: ['topicId'],
      where: { subjectId: 'subject-1' },
      transaction: undefined,
    });
    expect(result).toEqual([]);
    expect(mockModel.findAll).not.toHaveBeenCalled();
  });

  it('findRandomByFilters: ante error delega en raiseError', async () => {
    const dbError = new Error('DB error');
    (mockModel.findAll as any).mockRejectedValue(dbError);

    const handled = [] as any[];
    const raiseErrorSpy = vi
      .spyOn(repo as any, 'raiseError')
      .mockReturnValue(handled);

    const result = await repo.findRandomByFilters({ limit: 3 } as any);

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(handled);
  });
});
