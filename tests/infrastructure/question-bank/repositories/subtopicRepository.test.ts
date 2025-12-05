import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ModelStatic, Transaction } from 'sequelize';
import { Op } from 'sequelize';

vi.mock('../../../../app/infrastructure/question-bank/models', () => ({
  __esModule: true,
  SubTopic: class {},
  Topic: { findByPk: vi.fn() },
  Subject: {},
  SubjectTopic: {},
}));

import { SubtopicRepository } from '../../../../app/infrastructure/question-bank/repositories/subtopicRepository';
import { SubTopic as SubTopicModel, Topic as TopicModel } from '../../../../app/infrastructure/question-bank/models';

type SubtopicModelStatic = ModelStatic<SubTopicModel>;
const TopicMock = TopicModel as any;

describe('SubtopicRepository', () => {
  let mockModel: SubtopicModelStatic;
  let repo: SubtopicRepository;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    mockModel = {
      name: 'SubTopic',
      findAndCountAll: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
      findOne: vi.fn(),
    } as unknown as SubtopicModelStatic;

    repo = new SubtopicRepository(mockModel);
  });

  const makeRow = (id: string, name: string, topicId: string) =>
    ({
      get: () => ({ id, name, topicId }),
    } as any);

  const mockTopic = () =>
    TopicMock.findByPk.mockResolvedValue({
      get: () => ({ title: 'Topic Name' }),
    });

  it('paginateDetail: arma filtros y mapea filas a detalle', async () => {
    mockTopic();
    (mockModel.findAndCountAll as any).mockResolvedValue({
      rows: [makeRow('st1', 'Sub 1', 't1')],
      count: 1,
    });

    const res = await repo.paginateDetail({ limit: 5, offset: 0, filters: { topic_id: 't1', q: 'sub' } } as any);

    expect(mockModel.findAndCountAll).toHaveBeenCalledWith({
      where: { topicId: 't1', name: { [Op.like]: '%sub%' } },
      limit: 5,
      offset: 0,
      order: [['name', 'ASC']],
      transaction: undefined,
    });
    expect(res.items[0]).toMatchObject({
      subtopic_id: 'st1',
      subtopic_name: 'Sub 1',
      topic_id: 't1',
      topic_name: 'Topic Name',
    });
    expect(res.total).toBe(1);
  });

  it('get_detail_by_id: devuelve null si no existe', async () => {
    (mockModel.findByPk as any).mockResolvedValue(null);

    const res = await repo.get_detail_by_id('missing');

    expect(res).toBeNull();
  });

  it('create: valida dto, crea subtema y devuelve detalle', async () => {
    mockTopic();
    (mockModel.create as any).mockResolvedValue(makeRow('st1', 'Nuevo', '11111111-1111-4111-8111-111111111111'));

    const res = await repo.create({ name: 'Nuevo', topicId: '11111111-1111-4111-8111-111111111111' });

    expect(mockModel.create).toHaveBeenCalledWith(
      { name: 'Nuevo', topicId: '11111111-1111-4111-8111-111111111111' },
      { transaction: undefined },
    );
    expect(res).toMatchObject({
      subtopic_id: 'st1',
      topic_id: '11111111-1111-4111-8111-111111111111',
      topic_name: 'Topic Name',
    });
  });

  it('existsInTopic: retorna true si encuentra coincidencia', async () => {
    (mockModel.findOne as any).mockResolvedValue({});

    const res = await repo.existsInTopic('t1', 'Nombre');

    expect(mockModel.findOne).toHaveBeenCalledWith({
      where: { topicId: 't1', name: 'Nombre' },
      transaction: undefined,
    });
    expect(res).toBe(true);
  });

  it('deleteById: llama a destroy y devuelve booleano', async () => {
    (mockModel.destroy as any).mockResolvedValue(1);

    const res = await repo.deleteById('st1');

    expect(mockModel.destroy).toHaveBeenCalledWith({
      where: { id: 'st1' },
      transaction: undefined,
    });
    expect(res).toBe(true);
  });
});
