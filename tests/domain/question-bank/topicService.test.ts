import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { TopicService } from '../../../app/domains/question-bank/domain/services/topicService';
import { ITopicRepository } from '../../../app/domains/question-bank/domain/ports/ITopicRepository';
import { ISubjectRepository } from '../../../app/domains/question-bank/domain/ports/ISubjectRepository';

// ====== mock de los schemas de topic (para no depender de Zod real) ======

vi.mock(
  '../../../app/domains/question-bank/schemas/topicSchema',
  () => ({
    __esModule: true,
    topicCreateSchema: { parse: vi.fn((v: any) => v) },
    topicUpdateSchema: { parse: vi.fn((v: any) => v) },
  }),
);

// ====== helpers para repos mocks ======

const makeTopicRepo = () =>
  ({
    existsByTitle: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    paginateDetail: vi.fn(),
    get_detail_by_id: vi.fn(),
    deleteById: vi.fn(),
  } as any);

const makeSubjectRepo = () =>
  ({
    get_by_id: vi.fn(),
    existsSubjectTopic: vi.fn(),
    createSubjectTopic: vi.fn(),
    deleteSubjectTopic: vi.fn(),
  } as any);

// ====== configuración global de errores de dominio ======

beforeAll(() => {
  vi.spyOn(TopicService.prototype as any, 'raiseBusinessRuleError')
    .mockImplementation((...args: any[]) => {
      const message = args[1] ?? 'BUSINESS_RULE_ERROR';
      throw new Error(message);
    });

  vi.spyOn(TopicService.prototype as any, 'raiseNotFoundError')
    .mockImplementation((...args: any[]) => {
      const message = args[1] ?? 'NOT_FOUND_ERROR';
      throw new Error(message);
    });
});

afterEach(() => {
  vi.clearAllMocks();
});

// =======================================
// 1) create
// =======================================

describe('TopicService - create', () => {
  const makeService = () => {
    const repo = makeTopicRepo();
    const subjectRepo = makeSubjectRepo();
    const service = new TopicService({ repo, subjectRepo });
    return { service, repo };
  };

  it('crea un tema cuando el título está disponible (happy path)', async () => {
    const { service, repo } = makeService();

    repo.existsByTitle.mockResolvedValue(false);
    const created = {
      id: 'topic-1',
      title: 'Álgebra',
    } as any;
    repo.create.mockResolvedValue(created);

    const body: any = { topic_name: '  Álgebra  ' };

    const result = await service.create(body);

    // Se usa el título normalizado
    expect(repo.existsByTitle).toHaveBeenCalledWith('Álgebra');
    expect(repo.create).toHaveBeenCalledWith({ title: 'Álgebra' });
    expect(result).toBe(created);
  });

  it('lanza TOPIC_TITLE_TAKEN si el título ya existe', async () => {
    const { service, repo } = makeService();

    repo.existsByTitle.mockResolvedValue(true);

    const body: any = { topic_name: 'Álgebra' };

    await expect(service.create(body)).rejects.toThrow('TOPIC_TITLE_TAKEN');
    expect(repo.create).not.toHaveBeenCalled();
  });
});

// =======================================
// 2) update
// =======================================

describe('TopicService - update', () => {
  const makeService = () => {
    const repo = makeTopicRepo();
    const subjectRepo = makeSubjectRepo();
    const service = new TopicService({ repo, subjectRepo });
    return { service, repo };
  };

  it('si patch no trae topic_name, actualiza sin comprobar título', async () => {
    const { service, repo } = makeService();

    const updated = {
      id: 'topic-1',
      title: 'Álgebra',
    } as any;

    repo.update.mockResolvedValue(updated);

    const result = await service.update('topic-1', {} as any);

    expect(repo.existsByTitle).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith('topic-1', { title: undefined });
    expect(result).toBe(updated);
  });

  it('lanza TOPIC_TITLE_TAKEN si el nuevo título ya existe', async () => {
    const { service, repo } = makeService();

    repo.existsByTitle.mockResolvedValue(true);

    const patch: any = { topic_name: 'Álgebra avanzada' };

    await expect(service.update('topic-1', patch)).rejects.toThrow('TOPIC_TITLE_TAKEN');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('actualiza el título cuando el nuevo no está tomado', async () => {
    const { service, repo } = makeService();

    repo.existsByTitle.mockResolvedValue(false);

    const updated = {
      id: 'topic-1',
      title: 'Álgebra avanzada',
    } as any;
    repo.update.mockResolvedValue(updated);

    const patch: any = { topic_name: '  Álgebra avanzada  ' };

    const result = await service.update('topic-1', patch);

    expect(repo.existsByTitle).toHaveBeenCalledWith('Álgebra avanzada');
    expect(repo.update).toHaveBeenCalledWith('topic-1', { title: 'Álgebra avanzada' });
    expect(result).toBe(updated);
  });
});

// =======================================
// 3) paginateDetail
// =======================================

describe('TopicService - paginateDetail', () => {
  const makeService = () => {
    const repo = makeTopicRepo();
    const subjectRepo = makeSubjectRepo();
    const service = new TopicService({ repo, subjectRepo });
    return { service, repo };
  };

  it('usa valores por defecto para limit y offset y pasa filtros correctos', async () => {
    const { service, repo } = makeService();

    repo.paginateDetail.mockResolvedValue({
      items: [{ id: 'topic-1', title: 'Álgebra' } as any],
      total: 1,
    });

    const criteria: any = { q: 'alg', subject_id: 'subject-1' };

    const result = await service.paginateDetail(criteria);

    expect(repo.paginateDetail).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      filters: {
        q: 'alg',
        subject_id: 'subject-1',
        active: true,
      },
    });

    expect(result).toEqual({
      list: [{ id: 'topic-1', title: 'Álgebra' }],
      total: 1,
    });
  });

  it('respeta limit y offset proporcionados por el caller', async () => {
    const { service, repo } = makeService();

    repo.paginateDetail.mockResolvedValue({
      items: [],
      total: 0,
    });

    const criteria: any = { limit: 5, offset: 10, q: undefined, subject_id: undefined };

    const result = await service.paginateDetail(criteria);

    expect(repo.paginateDetail).toHaveBeenCalledWith({
      limit: 5,
      offset: 10,
      filters: {
        q: undefined,
        subject_id: undefined,
        active: true,
      },
    });

    expect(result).toEqual({ list: [], total: 0 });
  });
});

// =======================================
// 4) createSubjectTopic
// =======================================

describe('TopicService - createSubjectTopic', () => {
  const makeService = () => {
    const repo = makeTopicRepo();
    const subjectRepo = makeSubjectRepo();
    const service = new TopicService({ repo, subjectRepo });
    return { service, repo, subjectRepo };
  };

  const baseBody = {
    subject_id: 'subject-1',
    topic_id: 'topic-1',
  };

  it('lanza error si la asignatura no existe', async () => {
    const { service, subjectRepo } = makeService();

    subjectRepo.get_by_id.mockResolvedValue(null);

    await expect(service.createSubjectTopic(baseBody as any))
      .rejects.toThrow('No existe la asignatura');

    expect(subjectRepo.get_by_id).toHaveBeenCalledWith('subject-1');
  });

  it('lanza error si el tema no existe', async () => {
    const { service, subjectRepo, repo } = makeService();

    subjectRepo.get_by_id.mockResolvedValue({ id: 'subject-1' } as any);
    repo.get_detail_by_id.mockResolvedValueOnce(null); // la primera vez

    await expect(service.createSubjectTopic(baseBody as any))
      .rejects.toThrow('No existe el tema');

    expect(subjectRepo.get_by_id).toHaveBeenCalledWith('subject-1');
    expect(repo.get_detail_by_id).toHaveBeenCalledWith('topic-1');
  });

  it('lanza error si la relación ya existe', async () => {
    const { service, subjectRepo, repo } = makeService();

    subjectRepo.get_by_id.mockResolvedValue({ id: 'subject-1' } as any);
    repo.get_detail_by_id.mockResolvedValueOnce({ id: 'topic-1' } as any); // tema existe
    subjectRepo.existsSubjectTopic.mockResolvedValue(true);

    await expect(service.createSubjectTopic(baseBody as any))
      .rejects.toThrow('La relación ya existe');

    expect(subjectRepo.existsSubjectTopic)
      .toHaveBeenCalledWith('subject-1', 'topic-1');
    expect(subjectRepo.createSubjectTopic).not.toHaveBeenCalled();
  });

  it('lanza error si después de crear el link no se obtiene el detalle', async () => {
    const { service, subjectRepo, repo } = makeService();

    subjectRepo.get_by_id.mockResolvedValue({ id: 'subject-1' } as any);
    repo.get_detail_by_id
      .mockResolvedValueOnce({ id: 'topic-1' } as any) // primera vez: para validar que el tema existe
      .mockResolvedValueOnce(null); // segunda vez: para obtener el detalle tras crear el link

    subjectRepo.existsSubjectTopic.mockResolvedValue(false);
    subjectRepo.createSubjectTopic.mockResolvedValue(undefined);

    await expect(service.createSubjectTopic(baseBody as any))
      .rejects.toThrow('No se obtuvo el link creado');

    expect(subjectRepo.createSubjectTopic)
      .toHaveBeenCalledWith('subject-1', 'topic-1');
  });

  it('crea la relación y devuelve el detalle del tema (happy path)', async () => {
    const { service, subjectRepo, repo } = makeService();

    const topicDetail = { id: 'topic-1', title: 'Álgebra' } as any;

    subjectRepo.get_by_id.mockResolvedValue({ id: 'subject-1' } as any);
    repo.get_detail_by_id
      .mockResolvedValueOnce(topicDetail) // existe el tema
      .mockResolvedValueOnce(topicDetail); // después de crear el link

    subjectRepo.existsSubjectTopic.mockResolvedValue(false);
    subjectRepo.createSubjectTopic.mockResolvedValue(undefined);

    const result = await service.createSubjectTopic(baseBody as any);

    expect(subjectRepo.get_by_id).toHaveBeenCalledWith('subject-1');
    expect(repo.get_detail_by_id).toHaveBeenCalledWith('topic-1');
    expect(subjectRepo.existsSubjectTopic)
      .toHaveBeenCalledWith('subject-1', 'topic-1');
    expect(subjectRepo.createSubjectTopic)
      .toHaveBeenCalledWith('subject-1', 'topic-1');
    expect(result).toBe(topicDetail);
  });
});

// =======================================
// 5) deleteSubjectTopic
// =======================================

describe('TopicService - deleteSubjectTopic', () => {
  const makeService = () => {
    const repo = makeTopicRepo();
    const subjectRepo = makeSubjectRepo();
    const service = new TopicService({ repo, subjectRepo });
    return { service, subjectRepo };
  };

  it('delegates en subjectRepo.deleteSubjectTopic', async () => {
    const { service, subjectRepo } = makeService();

    subjectRepo.deleteSubjectTopic.mockResolvedValue(true);

    const body: any = {
      subject_id: 'subject-1',
      topic_id: 'topic-1',
    };

    const result = await service.deleteSubjectTopic(body);

    expect(subjectRepo.deleteSubjectTopic)
      .toHaveBeenCalledWith('subject-1', 'topic-1');
    expect(result).toBe(true);
  });
});

// =======================================
// 6) get_detail_by_id y deleteById
// =======================================

describe('TopicService - get_detail_by_id y deleteById', () => {
  const makeService = () => {
    const repo = makeTopicRepo();
    const subjectRepo = makeSubjectRepo();
    const service = new TopicService({ repo, subjectRepo });
    return { service, repo };
  };

  it('get_detail_by_id delega en el repo', async () => {
    const { service, repo } = makeService();

    const detail = { id: 'topic-1', title: 'Álgebra' } as any;
    repo.get_detail_by_id.mockResolvedValue(detail);

    const result = await service.get_detail_by_id('topic-1');

    expect(repo.get_detail_by_id).toHaveBeenCalledWith('topic-1');
    expect(result).toBe(detail);
  });

  it('deleteById delega en el repo', async () => {
    const { service, repo } = makeService();

    repo.deleteById.mockResolvedValue(true);

    const result = await service.deleteById('topic-1');

    expect(repo.deleteById).toHaveBeenCalledWith('topic-1');
    expect(result).toBe(true);
  });
});
