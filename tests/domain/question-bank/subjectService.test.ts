import { describe, it, expect, afterEach, vi } from 'vitest';
import { SubjectService } from '../../../app/domains/question-bank/domain/services/subjectService';

// ====== helper para repo mock ======

const makeRepo = () =>
  ({
    existsBy: vi.fn(),
    create: vi.fn(),
    get_detail_by_id: vi.fn(),
    paginate: vi.fn(),
    paginateDetail: vi.fn(),
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

describe('SubjectService - create', () => {
  const makeService = () => {
    const repo = makeRepo();
    const service = new SubjectService({ repo });
    return { service, repo };
  };

  it('crea una asignatura cuando el nombre está disponible (happy path)', async () => {
    const { service, repo } = makeService();

    repo.existsBy.mockResolvedValue(false);
    const created = { id: 'subj-1', name: 'Matemáticas', program: 'Ing. Informática' } as any;
    repo.create.mockResolvedValue(created);

    const detail = {
      id: 'subj-1',
      name: 'Matemáticas',
      program: 'Ing. Informática',
      leadTeacherId: null,
    } as any;
    repo.get_detail_by_id.mockResolvedValue(detail);

    const input: any = {
      subject_name: '  Matemáticas  ',
      subject_program: '  Ing. Informática  ',
    };

    const result = await service.create(input);

    expect(repo.existsBy).toHaveBeenCalledWith({ name: 'Matemáticas' });
    expect(repo.create).toHaveBeenCalledWith({
      name: 'Matemáticas',
      program: 'Ing. Informática',
      leadTeacherId: null,
    });
    expect(repo.get_detail_by_id).toHaveBeenCalledWith('subj-1');
    expect(result).toBe(detail);
  });

  it('lanza SUBJECT_NAME_TAKEN si el nombre ya existe', async () => {
    const { service, repo } = makeService();

    repo.existsBy.mockResolvedValue(true);

    const input: any = {
      subject_name: 'Matemáticas',
      subject_program: 'Ing. Informática',
    };

    await expect(service.create(input)).rejects.toThrow('SUBJECT_NAME_TAKEN');
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('lanza SUBJECT_NOT_FOUND_AFTER_CREATE si no se puede obtener el detalle tras crear', async () => {
    const { service, repo } = makeService();

    repo.existsBy.mockResolvedValue(false);
    const created = { id: 'subj-1', name: 'Matemáticas', program: 'Ing. Informática' } as any;
    repo.create.mockResolvedValue(created);
    repo.get_detail_by_id.mockResolvedValue(null);

    const input: any = {
      subject_name: 'Matemáticas',
      subject_program: 'Ing. Informática',
    };

    await expect(service.create(input)).rejects.toThrow('SUBJECT_NOT_FOUND_AFTER_CREATE');
  });
});

// =======================================
// 2) paginate
// =======================================

describe('SubjectService - paginate', () => {
  const makeService = () => {
    const repo = makeRepo();
    const service = new SubjectService({ repo });
    return { service, repo };
  };

  it('usa limit/offset por defecto y filtra por q', async () => {
    const { service, repo } = makeService();

    repo.paginate.mockResolvedValue({
      items: [{ id: 'subj-1', name: 'Matemáticas' } as any],
      total: 1,
    });

    const criteria: any = { q: 'mat' };

    const result = await service.paginate(criteria);

    expect(repo.paginate).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      filters: { q: 'mat' },
    });

    expect(result).toEqual({
      list: [{ id: 'subj-1', name: 'Matemáticas' }],
      total: 1,
    });
  });

  it('respeta limit y offset proporcionados', async () => {
    const { service, repo } = makeService();

    repo.paginate.mockResolvedValue({
      items: [],
      total: 0,
    });

    const criteria: any = { limit: 5, offset: 10, q: undefined };

    const result = await service.paginate(criteria);

    expect(repo.paginate).toHaveBeenCalledWith({
      limit: 5,
      offset: 10,
      filters: { q: undefined },
    });

    expect(result).toEqual({ list: [], total: 0 });
  });
});

// =======================================
// 3) paginateDetail
// =======================================

describe('SubjectService - paginateDetail', () => {
  const makeService = () => {
    const repo = makeRepo();
    const service = new SubjectService({ repo });
    return { service, repo };
  };

  it('construye criterios de filtrado y sort correctamente sin sort_field', async () => {
    const { service, repo } = makeService();

    repo.paginateDetail.mockResolvedValue({
      items: [{ id: 'subj-1', name: 'Matemáticas' } as any],
      total: 1,
    });

    const criteria: any = {
      q: 'mat',
      name: 'Matemáticas',
      program: 'Ing. Informática',
      leader_id: 'teacher-1',
    };

    const result = await service.paginateDetail(criteria);

    expect(repo.paginateDetail).toHaveBeenCalled();
    const arg = (repo.paginateDetail as any).mock.calls[0][0];

    expect(arg).toMatchObject({
      limit: 20,
      offset: 0,
      filters: {
        q: 'mat',
        name: 'Matemáticas',
        program: 'Ing. Informática',
        leadTeacherId: 'teacher-1',
      },
    });
    expect(arg.sort).toBeUndefined();
    expect(result).toEqual({
      list: [{ id: 'subj-1', name: 'Matemáticas' }],
      total: 1,
    });
  });

  it('incluye sort cuando se especifica sort_field y sort_dir', async () => {
    const { service, repo } = makeService();

    repo.paginateDetail.mockResolvedValue({
      items: [],
      total: 0,
    });

    const criteria: any = {
      limit: 10,
      offset: 5,
      q: undefined,
      name: undefined,
      program: undefined,
      leader_id: undefined,
      sort_field: 'name',
      sort_dir: 'desc',
    };

    const result = await service.paginateDetail(criteria);

    expect(repo.paginateDetail).toHaveBeenCalled();
    const arg = (repo.paginateDetail as any).mock.calls[0][0];

    expect(arg).toMatchObject({
      limit: 10,
      offset: 5,
      filters: {
        q: undefined,
        name: undefined,
        program: undefined,
        leadTeacherId: undefined,
      },
      sort: { field: 'name', dir: 'desc' },
    });

    expect(result).toEqual({ list: [], total: 0 });
  });

  it('usa dir por defecto asc cuando solo se indica sort_field', async () => {
    const { service, repo } = makeService();

    repo.paginateDetail.mockResolvedValue({
      items: [],
      total: 0,
    });

    const criteria: any = {
      sort_field: 'program',
      sort_dir: undefined,
    };

    await service.paginateDetail(criteria);

    const arg = (repo.paginateDetail as any).mock.calls[0][0];
    expect(arg.sort).toEqual({ field: 'program', dir: 'asc' });
  });
});

// =======================================
// 4) update
// =======================================

describe('SubjectService - update', () => {
  const makeService = () => {
    const repo = makeRepo();
    const service = new SubjectService({ repo });
    return { service, repo };
  };

  it('devuelve null si la asignatura no existe', async () => {
    const { service, repo } = makeService();

    repo.get_by_id.mockResolvedValue(null);

    const result = await service.update('subj-1', { subject_name: 'Nueva' });

    expect(repo.get_by_id).toHaveBeenCalledWith('subj-1');
    expect(result).toBeNull();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('si solo se actualiza el programa, no comprueba duplicado de nombre', async () => {
    const { service, repo } = makeService();

    const current = {
      id: 'subj-1',
      name: 'Matemáticas',
      program: 'Plan viejo',
    } as any;
    repo.get_by_id.mockResolvedValue(current);

    const updated = {
      id: 'subj-1',
      name: 'Matemáticas',
      program: 'Plan nuevo',
    } as any;
    repo.update.mockResolvedValue(updated);

    const detail = { ...updated } as any;
    repo.get_detail_by_id.mockResolvedValue(detail);

    const result = await service.update('subj-1', {
      subject_program: '  Plan nuevo  ',
    } as any);

    expect(repo.existsBy).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith('subj-1', {
      program: 'Plan nuevo',
    });
    expect(result).toBe(detail);
  });

  it('si el nuevo nombre es igual al actual, no comprueba duplicado pero actualiza', async () => {
    const { service, repo } = makeService();

    const current = {
      id: 'subj-1',
      name: 'Matemáticas',
      program: 'Plan viejo',
    } as any;
    repo.get_by_id.mockResolvedValue(current);

    const updated = {
      id: 'subj-1',
      name: 'Matemáticas',
      program: 'Plan viejo',
    } as any;
    repo.update.mockResolvedValue(updated);

    const detail = { ...updated } as any;
    repo.get_detail_by_id.mockResolvedValue(detail);

    const result = await service.update('subj-1', {
      subject_name: '  Matemáticas  ',
    } as any);

    expect(repo.existsBy).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith('subj-1', {
      name: 'Matemáticas',
    });
    expect(result).toBe(detail);
  });

  it('lanza SUBJECT_NAME_TAKEN si el nuevo nombre ya existe', async () => {
    const { service, repo } = makeService();

    const current = {
      id: 'subj-1',
      name: 'Matemáticas',
      program: 'Plan viejo',
    } as any;
    repo.get_by_id.mockResolvedValue(current);

    repo.existsBy.mockResolvedValue(true);

    await expect(
      service.update('subj-1', { subject_name: 'Física' } as any),
    ).rejects.toThrow('SUBJECT_NAME_TAKEN');

    expect(repo.update).not.toHaveBeenCalled();
  });

  it('actualiza nombre y programa cuando el nuevo nombre no está tomado', async () => {
    const { service, repo } = makeService();

    const current = {
      id: 'subj-1',
      name: 'Matemáticas',
      program: 'Plan viejo',
    } as any;
    repo.get_by_id.mockResolvedValue(current);

    repo.existsBy.mockResolvedValue(false);

    const updated = {
      id: 'subj-1',
      name: 'Física',
      program: 'Plan nuevo',
    } as any;
    repo.update.mockResolvedValue(updated);

    const detail = { ...updated } as any;
    repo.get_detail_by_id.mockResolvedValue(detail);

    const result = await service.update('subj-1', {
      subject_name: '  Física ',
      subject_program: '  Plan nuevo ',
    } as any);

    expect(repo.existsBy).toHaveBeenCalledWith({ name: 'Física' });
    expect(repo.update).toHaveBeenCalledWith('subj-1', {
      name: 'Física',
      program: 'Plan nuevo',
    });
    expect(result).toBe(detail);
  });

  it('devuelve null si repo.update devuelve null', async () => {
    const { service, repo } = makeService();

    const current = {
      id: 'subj-1',
      name: 'Matemáticas',
      program: 'Plan viejo',
    } as any;
    repo.get_by_id.mockResolvedValue(current);

    repo.existsBy.mockResolvedValue(false);
    repo.update.mockResolvedValue(null);

    const result = await service.update('subj-1', {
      subject_name: 'Física',
    } as any);

    expect(result).toBeNull();
  });

  it('lanza SUBJECT_NOT_FOUND_AFTER_UPDATE si no se puede obtener el detalle luego de actualizar', async () => {
    const { service, repo } = makeService();

    const current = {
      id: 'subj-1',
      name: 'Matemáticas',
      program: 'Plan viejo',
    } as any;
    repo.get_by_id.mockResolvedValue(current);

    repo.existsBy.mockResolvedValue(false);

    const updated = {
      id: 'subj-1',
      name: 'Física',
      program: 'Plan nuevo',
    } as any;
    repo.update.mockResolvedValue(updated);

    repo.get_detail_by_id.mockResolvedValue(null);

    await expect(
      service.update('subj-1', {
        subject_name: 'Física',
      } as any),
    ).rejects.toThrow('SUBJECT_NOT_FOUND_AFTER_UPDATE');
  });
});

// =======================================
// 5) get_detail_by_id, get_by_id, deleteById
// =======================================

describe('SubjectService - métodos delegados', () => {
  const makeService = () => {
    const repo = makeRepo();
    const service = new SubjectService({ repo });
    return { service, repo };
  };

  it('get_detail_by_id delega en repo.get_detail_by_id', async () => {
    const { service, repo } = makeService();

    const detail = { id: 'subj-1', name: 'Matemáticas' } as any;
    repo.get_detail_by_id.mockResolvedValue(detail);

    const result = await service.get_detail_by_id('subj-1');

    expect(repo.get_detail_by_id).toHaveBeenCalledWith('subj-1');
    expect(result).toBe(detail);
  });

  it('get_by_id delega en repo.get_by_id', async () => {
    const { service, repo } = makeService();

    const subject = { id: 'subj-1', name: 'Matemáticas' } as any;
    repo.get_by_id.mockResolvedValue(subject);

    const result = await service.get_by_id('subj-1');

    expect(repo.get_by_id).toHaveBeenCalledWith('subj-1');
    expect(result).toBe(subject);
  });

  it('deleteById delega en repo.deleteById', async () => {
    const { service, repo } = makeService();

    repo.deleteById.mockResolvedValue(true);

    const result = await service.deleteById('subj-1');

    expect(repo.deleteById).toHaveBeenCalledWith('subj-1');
    expect(result).toBe(true);
  });
});
