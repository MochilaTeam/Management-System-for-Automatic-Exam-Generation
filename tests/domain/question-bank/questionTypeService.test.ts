import { describe, it, expect, afterEach, vi } from 'vitest';
import { QuestionTypeService } from '../../../app/domains/question-bank/domain/services/questionTypeService';
import { QuestionTypeEnum } from '../../../app/domains/question-bank/entities/enums/QuestionType';
import { ConflictError } from '../../../app/shared/exceptions/domainErrors';

// ====== helper para repo mock (aflojamos tipos con any) ======

const makeRepo = () =>
  ({
    existsByName: vi.fn(),
    create: vi.fn(),
    paginate: vi.fn(),
    get_by_id: vi.fn(),
    update: vi.fn(),
    deleteById: vi.fn(),
  } as any);

afterEach(() => {
  vi.clearAllMocks();
});

// =======================================
// 1) create
// =======================================

describe('QuestionTypeService - create', () => {
  const makeService = () => {
    const repo = makeRepo();
    const service = new QuestionTypeService({ repo });
    return { service, repo };
  };

  it('crea un tipo de pregunta si el nombre está disponible (happy path)', async () => {
    const { service, repo } = makeService();

    repo.existsByName.mockResolvedValue(false);
    const created = {
      id: 'qt-1',
      name: QuestionTypeEnum.MCQ,
    } as any;
    repo.create.mockResolvedValue(created);

    const input: any = { name: QuestionTypeEnum.MCQ };

    const result = await service.create(input);

    expect(repo.existsByName).toHaveBeenCalledWith(QuestionTypeEnum.MCQ);
    expect(repo.create).toHaveBeenCalledWith({ name: QuestionTypeEnum.MCQ });
    expect(result).toBe(created);
  });

  it('lanza ConflictError si el nombre ya existe', async () => {
    const { service, repo } = makeService();

    repo.existsByName.mockResolvedValue(true);

    const input: any = { name: QuestionTypeEnum.MCQ };

    await expect(service.create(input)).rejects.toBeInstanceOf(ConflictError);
    await expect(service.create(input)).rejects.toThrow('El tipo de pregunta ya existe');

    expect(repo.create).not.toHaveBeenCalled();
  });
});

// =======================================
// 2) paginate
// =======================================

describe('QuestionTypeService - paginate', () => {
  const makeService = () => {
    const repo = makeRepo();
    const service = new QuestionTypeService({ repo });
    return { service, repo };
  };

  it('usa valores por defecto de limit y offset y filtra por name', async () => {
    const { service, repo } = makeService();

    repo.paginate.mockResolvedValue({
      items: [{ id: 'qt-1', name: QuestionTypeEnum.MCQ } as any],
      total: 1,
    });

    const criteria: any = { name: QuestionTypeEnum.MCQ };

    const result = await service.paginate(criteria);

    expect(repo.paginate).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      filters: { name: QuestionTypeEnum.MCQ },
    });

    expect(result).toEqual({
      list: [{ id: 'qt-1', name: QuestionTypeEnum.MCQ }],
      total: 1,
    });
  });

  it('respeta limit y offset proporcionados', async () => {
    const { service, repo } = makeService();

    repo.paginate.mockResolvedValue({
      items: [],
      total: 0,
    });

    const criteria: any = { limit: 5, offset: 10, name: undefined };

    const result = await service.paginate(criteria);

    expect(repo.paginate).toHaveBeenCalledWith({
      limit: 5,
      offset: 10,
      filters: { name: undefined },
    });

    expect(result).toEqual({ list: [], total: 0 });
  });
});

// =======================================
// 3) update
// =======================================

describe('QuestionTypeService - update', () => {
  const makeService = () => {
    const repo = makeRepo();
    const service = new QuestionTypeService({ repo });
    return { service, repo };
  };

  it('devuelve null si el tipo no existe', async () => {
    const { service, repo } = makeService();

    repo.get_by_id.mockResolvedValue(null);

    const result = await service.update('qt-1', { name: QuestionTypeEnum.MCQ });

    expect(repo.get_by_id).toHaveBeenCalledWith('qt-1');
    expect(result).toBeNull();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('si patch no trae name, actualiza con dto vacío', async () => {
    const { service, repo } = makeService();

    const current = { id: 'qt-1', name: QuestionTypeEnum.MCQ } as any;
    repo.get_by_id.mockResolvedValue(current);

    const updated = { id: 'qt-1', name: QuestionTypeEnum.MCQ } as any;
    repo.update.mockResolvedValue(updated);

    const result = await service.update('qt-1', {});

    expect(repo.existsByName).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith('qt-1', {});
    expect(result).toBe(updated);
  });

  it('si el nombre es el mismo, no verifica duplicado pero actualiza con ese nombre', async () => {
    const { service, repo } = makeService();

    const current = { id: 'qt-1', name: QuestionTypeEnum.MCQ } as any;
    repo.get_by_id.mockResolvedValue(current);

    const updated = { id: 'qt-1', name: QuestionTypeEnum.MCQ } as any;
    repo.update.mockResolvedValue(updated);

    const result = await service.update('qt-1', { name: QuestionTypeEnum.MCQ });

    expect(repo.existsByName).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith('qt-1', { name: QuestionTypeEnum.MCQ });
    expect(result).toBe(updated);
  });

  it('lanza ConflictError si el nuevo nombre ya está tomado', async () => {
    const { service, repo } = makeService();

    const current = { id: 'qt-1', name: QuestionTypeEnum.MCQ } as any;
    repo.get_by_id.mockResolvedValue(current);

    repo.existsByName.mockResolvedValue(true);

    await expect(
      service.update('qt-1', { name: QuestionTypeEnum.TRUE_FALSE }),
    ).rejects.toBeInstanceOf(ConflictError);

    await expect(
      service.update('qt-1', { name: QuestionTypeEnum.TRUE_FALSE }),
    ).rejects.toThrow('El tipo de pregunta ya existe');

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('actualiza el nombre si el nuevo no está tomado', async () => {
    const { service, repo } = makeService();

    const current = { id: 'qt-1', name: QuestionTypeEnum.MCQ } as any;
    repo.get_by_id.mockResolvedValue(current);

    repo.existsByName.mockResolvedValue(false);

    const updated = { id: 'qt-1', name: QuestionTypeEnum.TRUE_FALSE } as any;
    repo.update.mockResolvedValue(updated);

    const result = await service.update('qt-1', { name: QuestionTypeEnum.TRUE_FALSE });

    expect(repo.existsByName).toHaveBeenCalledWith(QuestionTypeEnum.TRUE_FALSE);
    expect(repo.update).toHaveBeenCalledWith('qt-1', {
      name: QuestionTypeEnum.TRUE_FALSE,
    });
    expect(result).toBe(updated);
  });
});

// =======================================
// 4) get_by_id y deleteById
// =======================================

describe('QuestionTypeService - get_by_id y deleteById', () => {
  const makeService = () => {
    const repo = makeRepo();
    const service = new QuestionTypeService({ repo });
    return { service, repo };
  };

  it('get_by_id delega correctamente en el repo', async () => {
    const { service, repo } = makeService();

    const qt = { id: 'qt-1', name: QuestionTypeEnum.MCQ } as any;
    repo.get_by_id.mockResolvedValue(qt);

    const result = await service.get_by_id('qt-1');

    expect(repo.get_by_id).toHaveBeenCalledWith('qt-1');
    expect(result).toBe(qt);
  });

  it('deleteById delega correctamente en el repo', async () => {
    const { service, repo } = makeService();

    repo.deleteById.mockResolvedValue(true);

    const result = await service.deleteById('qt-1');

    expect(repo.deleteById).toHaveBeenCalledWith('qt-1');
    expect(result).toBe(true);
  });
});
