import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ModelStatic } from 'sequelize';

import { QuestionTypeRepository } from '../../../../app/infrastructure/question-bank/repositories/QuestionTypeRepository';
import type QuestionType from '../../../../app/infrastructure/question-bank/models/QuestionType';
import { QuestionTypeMapper } from '../../../../app/infrastructure/question-bank/mappers/questionTypeMapper';

type QuestionTypeModelStatic = ModelStatic<QuestionType>;

describe('QuestionTypeRepository (infra, unitario)', () => {
  let mockModel: QuestionTypeModelStatic;
  let repo: QuestionTypeRepository;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    mockModel = {
      name: 'QuestionType',
      count: vi.fn(),
      destroy: vi.fn(),
    } as unknown as QuestionTypeModelStatic;

    repo = new QuestionTypeRepository(mockModel);
  });

  // ---------- paginate ----------
  it('paginate: usa QuestionTypeMapper.toOptions y delega en paginateByOptions', async () => {
    const criteria: any = { name: 'MCQ', limit: 10, offset: 5 };

    const opts = {
      where: { name: 'MCQ' },
      order: [['createdAt', 'DESC']] as any,
      limit: 10,
      offset: 5,
    };

    const toOptionsSpy = vi
      .spyOn(QuestionTypeMapper, 'toOptions')
      .mockReturnValue(opts as any);

    const expected = { rows: [{ id: 'qt-1' }], count: 1 } as any;
    const paginateByOptionsSpy = vi
      .spyOn(repo as any, 'paginateByOptions')
      .mockReturnValue(expected);

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
  it('list: usa QuestionTypeMapper.toOptions y delega en listByOptions', async () => {
    const criteria: any = { name: 'TRUE_FALSE', limit: 20 };

    const opts = {
      where: { name: 'TRUE_FALSE' },
      order: [['createdAt', 'ASC']] as any,
      limit: 20,
      offset: 0,
    };

    const toOptionsSpy = vi
      .spyOn(QuestionTypeMapper, 'toOptions')
      .mockReturnValue(opts as any);

    const expectedList = [{ id: 'qt-2' }] as any[];
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

  // ---------- existsByName ----------
  it('existsByName: hace count por nombre y devuelve true si hay registros', async () => {
    (mockModel.count as any).mockResolvedValue(2);

    const result = await repo.existsByName('MCQ');

    expect(mockModel.count).toHaveBeenCalledWith({
      where: { name: 'MCQ' },
      transaction: undefined,
    });
    expect(result).toBe(true);
  });

  it('existsByName: devuelve false si count = 0', async () => {
    (mockModel.count as any).mockResolvedValue(0);

    const result = await repo.existsByName('ESSAY');

    expect(result).toBe(false);
  });

  it('existsByName: ante error delega en raiseError', async () => {
    const dbError = new Error('DB error');
    (mockModel.count as any).mockRejectedValue(dbError);

    const handled = false;
    const raiseErrorSpy = vi
      .spyOn(repo as any, 'raiseError')
      .mockReturnValue(handled);

    const result = await repo.existsByName('MCQ');

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(handled);
  });

  // ---------- deleteById ----------
  it('deleteById: devuelve true cuando destroy > 0', async () => {
    (mockModel.destroy as any).mockResolvedValue(1);

    const result = await repo.deleteById('qt-1');

    expect(mockModel.destroy).toHaveBeenCalledWith({
      where: { id: 'qt-1' },
      transaction: undefined,
    });
    expect(result).toBe(true);
  });

  it('deleteById: devuelve false cuando destroy = 0', async () => {
    (mockModel.destroy as any).mockResolvedValue(0);

    const result = await repo.deleteById('qt-1');

    expect(result).toBe(false);
  });

  it('deleteById: ante error delega en raiseError', async () => {
    const dbError = new Error('DB error');
    (mockModel.destroy as any).mockRejectedValue(dbError);

    const handled = false;
    const raiseErrorSpy = vi
      .spyOn(repo as any, 'raiseError')
      .mockReturnValue(handled);

    const result = await repo.deleteById('qt-1');

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(handled);
  });
});
