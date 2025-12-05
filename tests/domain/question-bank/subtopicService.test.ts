import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';

// ====== mocks de módulos externos que usa SubtopicService ======

vi.mock(
  '../../../app/infrastructure/question-bank/models',
  () => ({
    __esModule: true,
    Topic: { findByPk: vi.fn() },
  }),
);

vi.mock(
  '../../../app/domains/question-bank/schemas/subtopicSchema',
  () => ({
    __esModule: true,
    createSubtopicBodySchema: { parse: vi.fn((v: any) => v) },
    subtopicCreateSchema: { parse: vi.fn((v: any) => v) },
  }),
);

// ====== imports reales (ya usando los mocks de arriba) ======

import { SubtopicService } from '../../../app/domains/question-bank/domain/services/subtopicService';
import { Topic as TopicModel } from '../../../app/infrastructure/question-bank/models';

const TopicMock = TopicModel as any;

// ====== helper de repo mock ======

const makeRepo = () =>
  ({
    existsInTopic: vi.fn(),
    create: vi.fn(),
    paginateDetail: vi.fn(),
    get_detail_by_id: vi.fn(),
    deleteById: vi.fn(),
  } as any);

beforeAll(() => {
  // no hay BaseDomainService ni errores custom aquí, así que nada extra
});

afterEach(() => {
  vi.clearAllMocks();
});

// =======================================
// 1) create
// =======================================

describe('SubtopicService - create', () => {
  const makeService = () => {
    const repo = makeRepo();
    const service = new SubtopicService(repo);
    return { service, repo };
  };

  const rawBody = {
    topic_associated_id: 'topic-1',
    subtopic_name: '  Sistemas de ecuaciones  ',
  };

  it('lanza TOPIC_NOT_FOUND si el tema no existe', async () => {
    const { service } = makeService();

    TopicMock.findByPk.mockResolvedValue(null);

    await expect(service.create(rawBody)).rejects.toThrow('TOPIC_NOT_FOUND');

    expect(TopicMock.findByPk).toHaveBeenCalledWith('topic-1');
  });

  it('lanza SUBTOPIC_ALREADY_EXISTS_IN_TOPIC si el nombre ya existe en el tema', async () => {
    const { service, repo } = makeService();

    TopicMock.findByPk.mockResolvedValue({ id: 'topic-1', title: 'Álgebra' } as any);
    repo.existsInTopic.mockResolvedValue(true);

    await expect(service.create(rawBody)).rejects.toThrow(
      'SUBTOPIC_ALREADY_EXISTS_IN_TOPIC',
    );

    // Nombre normalizado
    expect(repo.existsInTopic).toHaveBeenCalledWith(
      'topic-1',
      'Sistemas de ecuaciones',
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('crea un subtema cuando el tema existe y el nombre no está tomado (happy path)', async () => {
    const { service, repo } = makeService();

    TopicMock.findByPk.mockResolvedValue({ id: 'topic-1', title: 'Álgebra' } as any);
    repo.existsInTopic.mockResolvedValue(false);

    const created = {
      id: 'subtopic-1',
      topicId: 'topic-1',
      name: 'Sistemas de ecuaciones',
    } as any;

    repo.create.mockResolvedValue(created);

    const result = await service.create(rawBody);

    expect(TopicMock.findByPk).toHaveBeenCalledWith('topic-1');
    expect(repo.existsInTopic).toHaveBeenCalledWith(
      'topic-1',
      'Sistemas de ecuaciones',
    );
    expect(repo.create).toHaveBeenCalledWith({
      topicId: 'topic-1',
      name: 'Sistemas de ecuaciones',
    });
    expect(result).toBe(created);
  });
});

// =======================================
// 2) paginateDetail
// =======================================

describe('SubtopicService - paginateDetail', () => {
  const makeService = () => {
    const repo = makeRepo();
    const service = new SubtopicService(repo);
    return { service, repo };
  };

  it('usa limit/offset por defecto y pasa filtros correctos', async () => {
    const { service, repo } = makeService();

    repo.paginateDetail.mockResolvedValue({
      items: [{ id: 'subtopic-1', name: 'Sistemas de ecuaciones' } as any],
      total: 1,
    });

    const criteria: any = { q: 'sist', topic_id: 'topic-1' };

    const result = await service.paginateDetail(criteria);

    expect(repo.paginateDetail).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      filters: {
        q: 'sist',
        topic_id: 'topic-1',
      },
    });

    expect(result).toEqual({
      list: [{ id: 'subtopic-1', name: 'Sistemas de ecuaciones' }],
      total: 1,
    });
  });

  it('respeta limit y offset proporcionados', async () => {
    const { service, repo } = makeService();

    repo.paginateDetail.mockResolvedValue({
      items: [],
      total: 0,
    });

    const criteria: any = {
      limit: 5,
      offset: 10,
      q: undefined,
      topic_id: undefined,
    };

    const result = await service.paginateDetail(criteria);

    expect(repo.paginateDetail).toHaveBeenCalledWith({
      limit: 5,
      offset: 10,
      filters: {
        q: undefined,
        topic_id: undefined,
      },
    });

    expect(result).toEqual({ list: [], total: 0 });
  });
});

// =======================================
// 3) get_detail_by_id y deleteById
// =======================================

describe('SubtopicService - métodos delegados', () => {
  const makeService = () => {
    const repo = makeRepo();
    const service = new SubtopicService(repo);
    return { service, repo };
  };

  it('get_detail_by_id delega en repo.get_detail_by_id', async () => {
    const { service, repo } = makeService();

    const detail = {
      id: 'subtopic-1',
      topicId: 'topic-1',
      name: 'Sistemas de ecuaciones',
    } as any;

    repo.get_detail_by_id.mockResolvedValue(detail);

    const result = await service.get_detail_by_id('subtopic-1');

    expect(repo.get_detail_by_id).toHaveBeenCalledWith('subtopic-1');
    expect(result).toBe(detail);
  });

  it('deleteById delega en repo.deleteById', async () => {
    const { service, repo } = makeService();

    repo.deleteById.mockResolvedValue(true);

    const result = await service.deleteById('subtopic-1');

    expect(repo.deleteById).toHaveBeenCalledWith('subtopic-1');
    expect(result).toBe(true);
  });
});
