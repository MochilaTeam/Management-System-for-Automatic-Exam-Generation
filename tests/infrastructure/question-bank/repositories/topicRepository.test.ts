import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ModelStatic, Transaction } from 'sequelize';

vi.mock('../../../../app/infrastructure/question-bank/models', () => ({
  __esModule: true,
  Topic: class {},
  SubTopic: {
    findAll: vi.fn(),
    destroy: vi.fn(),
  },
  Subject: {
    findAll: vi.fn(),
  },
  SubjectTopic: {
    findAll: vi.fn(),
    destroy: vi.fn(),
  },
}));

import { TopicRepository } from '../../../../app/infrastructure/question-bank/repositories/topicRepository';
import {
  Topic as TopicModel,
  SubTopic as SubTopicModel,
  Subject as SubjectModel,
  SubjectTopic as SubjectTopicModel,
} from '../../../../app/infrastructure/question-bank/models';

type TopicModelStatic = ModelStatic<TopicModel>;
const SubjectTopicMock = SubjectTopicModel as any;
const SubTopicMock = SubTopicModel as any;
const SubjectMock = SubjectModel as any;

describe('TopicRepository', () => {
  let mockModel: TopicModelStatic;
  let repo: TopicRepository;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    mockModel = {
      name: 'Topic',
      findAndCountAll: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
    } as unknown as TopicModelStatic;

    repo = new TopicRepository(mockModel);
  });

  it('paginateDetail: filtra por subject_id usando pivot y mapea resultados', async () => {
    SubjectTopicMock.findAll.mockResolvedValue([
      { get: () => ({ topicId: 't1', subjectId: 's1' }) },
    ]);
    (mockModel.findAndCountAll as any).mockResolvedValue({
      rows: ['row-1'],
      count: 1,
    });
    vi.spyOn(repo as any, 'buildDetail').mockResolvedValue({ topic_id: 't1' });

    const res = await repo.paginateDetail({
      limit: 10,
      offset: 0,
      filters: { q: undefined, subject_id: 's1' },
    } as any);

    expect(SubjectTopicMock.findAll).toHaveBeenCalledWith({
      where: { subjectId: 's1' },
      transaction: undefined,
      attributes: ['topicId'],
    });
    expect(mockModel.findAndCountAll).toHaveBeenCalledWith({
      where: { id: ['t1'] },
      limit: 10,
      offset: 0,
      order: [['title', 'ASC']],
      transaction: undefined,
    });
    expect(res).toEqual({ items: [{ topic_id: 't1' }], total: 1 });
  });

  it('get_detail_by_id: devuelve null si no existe', async () => {
    (mockModel.findByPk as any).mockResolvedValue(null);

    const res = await repo.get_detail_by_id('missing');

    expect(res).toBeNull();
  });

  it('create: valida y retorna detalle mediante buildDetail', async () => {
    const buildSpy = vi
      .spyOn(repo as any, 'buildDetail')
      .mockResolvedValue({ topic_id: 't1' });
    (mockModel.create as any).mockResolvedValue('row');

    const res = await repo.create({ title: 'Álgebra' });

    expect(mockModel.create).toHaveBeenCalledWith(
      { title: 'Álgebra' },
      { transaction: undefined },
    );
    expect(buildSpy).toHaveBeenCalledWith('row', undefined);
    expect(res).toEqual({ topic_id: 't1' });
  });

  it('update: si patch es vacío, llama a get_detail_by_id', async () => {
    const detailSpy = vi.spyOn(repo, 'get_detail_by_id').mockResolvedValue({ topic_id: 't1' } as any);

    const res = await repo.update('t1', {} as any);

    expect(detailSpy).toHaveBeenCalledWith('t1', undefined);
    expect(res).toEqual({ topic_id: 't1' });
    expect(mockModel.update).not.toHaveBeenCalled();
  });

  it('deleteById: elimina pivotes y subtemas antes de borrar el topic', async () => {
    SubjectTopicMock.destroy.mockResolvedValue(1);
    SubTopicMock.destroy.mockResolvedValue(1);
    (mockModel.destroy as any).mockResolvedValue(1);

    const deleted = await repo.deleteById('t1');

    expect(SubjectTopicMock.destroy).toHaveBeenCalledWith({
      where: { topicId: 't1' },
      transaction: undefined,
    });
    expect(SubTopicMock.destroy).toHaveBeenCalledWith({
      where: { topicId: 't1' },
      transaction: undefined,
    });
    expect(mockModel.destroy).toHaveBeenCalledWith({
      where: { id: 't1' },
      transaction: undefined,
    });
    expect(deleted).toBe(true);
  });
});
