import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ModelStatic } from 'sequelize';

import { SubjectRepository } from '../../../../app/infrastructure/question-bank/repositories/subjectRepository';
import type { Subject as SubjectModel } from '../../../../app/infrastructure/question-bank/models';
import { SubjectMapper } from '../../../../app/infrastructure/question-bank/mappers/subjectMapper';
import { BaseRepository } from '../../../../app/shared/domain/base_repository';
import { Subject as SubjectModelClass } from '../../../../app/infrastructure/question-bank/models';
import { SubjectTopic as SubjectTopicModel } from '../../../../app/infrastructure/question-bank/models';

type SubjectModelStatic = ModelStatic<SubjectModel>;

describe('SubjectRepository (infra, unitario)', () => {
  let mockModel: SubjectModelStatic;
  let repo: SubjectRepository;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    mockModel = {
      name: 'Subject',
      destroy: vi.fn(),
      findByPk: vi.fn(),
    } as unknown as SubjectModelStatic;

    repo = new SubjectRepository(mockModel);
  });

  // ---------- paginate ----------
  it('paginate: usa SubjectMapper.toOptions y delega en paginateByOptions', async () => {
    const criteria: any = { q: 'mat', limit: 10, offset: 5 };

    const opts = {
      where: { name: 'Matemáticas' },
      order: [['name', 'ASC']] as any,
      limit: 10,
      offset: 5,
    };

    const toOptionsSpy = vi
      .spyOn(SubjectMapper, 'toOptions')
      .mockReturnValue(opts as any);

    const expected = { items: [{ id: 's1' }], total: 1 };
    const paginateByOptionsSpy = vi
      .spyOn(repo as any, 'paginateByOptions')
      .mockResolvedValue(expected);

    const result = await repo.paginate(criteria);

    expect(toOptionsSpy).toHaveBeenCalledWith(criteria);
    expect(paginateByOptionsSpy).toHaveBeenCalledWith(
      {
        where: opts.where,
        order: opts.order,
        limit: opts.limit,
        offset: opts.offset,
      },
      undefined,
    );
    expect(result).toBe(expected);
  });

  // ---------- list ----------
  it('list: usa SubjectMapper.toOptions y delega en listByOptions', async () => {
    const criteria: any = { q: 'fis', limit: 20 };

    const opts = {
      where: { name: 'Física' },
      order: [['name', 'DESC']] as any,
      limit: 20,
      offset: 0,
    };

    const toOptionsSpy = vi
      .spyOn(SubjectMapper, 'toOptions')
      .mockReturnValue(opts as any);

    const expectedList = [{ id: 's2' }] as any[];
    const listByOptionsSpy = vi
      .spyOn(repo as any, 'listByOptions')
      .mockResolvedValue(expectedList);

    const result = await repo.list(criteria);

    expect(toOptionsSpy).toHaveBeenCalledWith(criteria);
    expect(listByOptionsSpy).toHaveBeenCalledWith(
      {
        where: opts.where,
        order: opts.order,
        limit: opts.limit,
        offset: opts.offset,
      },
      undefined,
    );
    expect(result).toBe(expectedList);
  });

  // ---------- existsBy ----------
  it('existsBy: usa SubjectMapper.toWhereFromFilters y delega en BaseRepository.exists', async () => {
    const filters = { name: 'Matemáticas' };

    const whereObj = { name: 'Matemáticas', program: 'Ing' };
    const toWhereSpy = vi
      .spyOn(SubjectMapper, 'toWhereFromFilters')
      .mockReturnValue(whereObj as any);

    const existsSpy = vi
      .spyOn(BaseRepository.prototype as any, 'exists')
      .mockResolvedValue(true);

    const result = await repo.existsBy(filters);

    expect(toWhereSpy).toHaveBeenCalledWith(filters);
    expect(existsSpy).toHaveBeenCalledWith(whereObj, undefined);
    expect(result).toBe(true);
  });

  // ---------- deleteById ----------
  it('deleteById: devuelve true cuando destroy > 0', async () => {
    (mockModel.destroy as any).mockResolvedValue(1);

    const result = await repo.deleteById('subj-1');

    expect(mockModel.destroy).toHaveBeenCalledWith({
      where: { id: 'subj-1' },
      transaction: undefined,
    });
    expect(result).toBe(true);
  });

  it('deleteById: devuelve false cuando destroy = 0', async () => {
    (mockModel.destroy as any).mockResolvedValue(0);

    const result = await repo.deleteById('subj-1');

    expect(result).toBe(false);
  });

  // ---------- existsSubjectTopic ----------
  it('existsSubjectTopic: devuelve true si SubjectTopicModel.findOne encuentra fila', async () => {
    const findOneSpy = vi
      .spyOn(SubjectTopicModel, 'findOne')
      .mockResolvedValue({} as any);

    const result = await repo.existsSubjectTopic('subj-1', 'topic-1');

    expect(findOneSpy).toHaveBeenCalledWith({
      where: { subjectId: 'subj-1', topicId: 'topic-1' },
      transaction: undefined,
    });
    expect(result).toBe(true);
  });

  it('existsSubjectTopic: devuelve false si no encuentra fila', async () => {
    vi.spyOn(SubjectTopicModel, 'findOne').mockResolvedValue(null as any);

    const result = await repo.existsSubjectTopic('subj-1', 'topic-1');

    expect(result).toBe(false);
  });

  // ---------- createSubjectTopic ----------
  it('createSubjectTopic: crea registro en SubjectTopicModel', async () => {
    const createSpy = vi
      .spyOn(SubjectTopicModel, 'create')
      .mockResolvedValue({} as any);

    await repo.createSubjectTopic('subj-1', 'topic-1');

    expect(createSpy).toHaveBeenCalledWith(
      { subjectId: 'subj-1', topicId: 'topic-1' },
      { transaction: undefined },
    );
  });

  // ---------- deleteSubjectTopic ----------
  it('deleteSubjectTopic: devuelve true cuando destroy > 0', async () => {
    const destroySpy = vi
      .spyOn(SubjectTopicModel, 'destroy')
      .mockResolvedValue(1 as any);

    const result = await repo.deleteSubjectTopic('subj-1', 'topic-1');

    expect(destroySpy).toHaveBeenCalledWith({
      where: { subjectId: 'subj-1', topicId: 'topic-1' },
      transaction: undefined,
    });
    expect(result).toBe(true);
  });

  it('deleteSubjectTopic: devuelve false cuando destroy = 0', async () => {
    vi.spyOn(SubjectTopicModel, 'destroy').mockResolvedValue(0 as any);

    const result = await repo.deleteSubjectTopic('subj-1', 'topic-1');

    expect(result).toBe(false);
  });

  // ---------- get_detail_by_id ----------
  it('get_detail_by_id: devuelve null si no encuentra subject', async () => {
    (mockModel.findByPk as any).mockResolvedValue(null);

    const result = await repo.get_detail_by_id('subj-1');

    expect(mockModel.findByPk).toHaveBeenCalledWith('subj-1', {
      transaction: undefined,
    });
    expect(result).toBeNull();
  });

  it('get_detail_by_id: usa buildDetailForSubject cuando encuentra subject', async () => {
    const row: any = {
      get: vi.fn().mockReturnValue({
        id: 'subj-1',
        name: 'Matemáticas',
        program: 'Ing',
        leadTeacherId: 'teacher-1',
      }),
    };

    (mockModel.findByPk as any).mockResolvedValue(row);

    const detail = { subject_id: 'subj-1' } as any;
    const buildDetailSpy = vi
      .spyOn(repo as any, 'buildDetailForSubject')
      .mockResolvedValue(detail);

    const result = await repo.get_detail_by_id('subj-1');

    expect(mockModel.findByPk).toHaveBeenCalledWith('subj-1', {
      transaction: undefined,
    });
    expect(buildDetailSpy).toHaveBeenCalledWith(
      {
        id: 'subj-1',
        name: 'Matemáticas',
        program: 'Ing',
        leadTeacherId: 'teacher-1',
      },
      undefined,
    );
    expect(result).toBe(detail);
  });

  it('get_detail_by_id: ante error delega en raiseError', async () => {
    const dbError = new Error('DB error');
    (mockModel.findByPk as any).mockRejectedValue(dbError);

    const handled = null as any;
    const raiseErrorSpy = vi
      .spyOn(repo as any, 'raiseError')
      .mockReturnValue(handled);

    const result = await repo.get_detail_by_id('subj-1');

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(handled);
  });

  // ---------- paginateDetail ----------
  it('paginateDetail: cuando SubjectRead incluye leadTeacherId usa ese valor', async () => {
    const criteria: any = { limit: 10, offset: 0 };

    const subjects = [
      { id: 's1', name: 'Mat', program: 'Ing', leadTeacherId: 't1' },
    ] as any[];

    const paginateSpy = vi
      .spyOn(repo, 'paginate')
      .mockResolvedValue({ items: subjects, total: 1 } as any);

    const detail = { subject_id: 's1' } as any;
    const buildDetailSpy = vi
      .spyOn(repo as any, 'buildDetailForSubject')
      .mockResolvedValue(detail);

    const result = await repo.paginateDetail(criteria);

    expect(paginateSpy).toHaveBeenCalledWith(criteria, undefined);
    expect(buildDetailSpy).toHaveBeenCalledWith(
      {
        id: 's1',
        name: 'Mat',
        program: 'Ing',
        leadTeacherId: 't1',
      },
      undefined,
    );
    expect(result).toEqual({ items: [detail], total: 1 });
  });

    it('paginateDetail: cuando SubjectRead no tiene leadTeacherId lo resuelve con this.model.findByPk', async () => {
    const criteria: any = { limit: 10, offset: 0 };

    // SubjectRead sin leadTeacherId
    const subjects = [{ id: 's2', name: 'Fis', program: 'Ing' }] as any[];
    vi.spyOn(repo, 'paginate').mockResolvedValue({ items: subjects, total: 1 } as any);

    const fullRow: any = {
      get: vi.fn().mockReturnValue({ leadTeacherId: 't2' }),
    };
    // usamos el mockModel que es this.model internamente
    (mockModel.findByPk as any).mockResolvedValue(fullRow);

    const detail = { subject_id: 's2' } as any;
    const buildDetailSpy = vi
      .spyOn(repo as any, 'buildDetailForSubject')
      .mockResolvedValue(detail);

    const result = await repo.paginateDetail(criteria);

    expect(mockModel.findByPk).toHaveBeenCalledWith('s2', {
      transaction: undefined,
    });
    expect(buildDetailSpy).toHaveBeenCalledWith(
      {
        id: 's2',
        name: 'Fis',
        program: 'Ing',
        leadTeacherId: 't2',
      },
      undefined,
    );
    expect(result).toEqual({ items: [detail], total: 1 });
  });


  it('paginateDetail: ante error delega en raiseError', async () => {
    const criteria: any = { limit: 10 };
    const dbError = new Error('DB error');

    vi.spyOn(repo, 'paginate').mockRejectedValue(dbError);

    const handled = { items: [], total: 0 } as any;
    const raiseErrorSpy = vi
      .spyOn(repo as any, 'raiseError')
      .mockReturnValue(handled);

    const result = await repo.paginateDetail(criteria);

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(handled);
  });
});
