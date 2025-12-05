import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';

import { StudentService } from '../../../app/domains/user/domain/services/studentService';

const makeStudentRepo = () =>
  ({
    existsBy: vi.fn(),
    createProfile: vi.fn(),
    get_by_id: vi.fn(),
    paginate: vi.fn(),
    updateProfile: vi.fn(),
    deleteById: vi.fn(),
  } as any);

const makeUserRepo = () =>
  ({
    get_by_id: vi.fn(),
  } as any);

beforeAll(() => {
  vi.spyOn(StudentService.prototype as any, 'raiseBusinessRuleError').mockImplementation(
    (...args: any[]) => {
      const message = args[1] ?? 'BUSINESS_RULE_ERROR';
      throw new Error(message);
    },
  );
  vi.spyOn(StudentService.prototype as any, 'raiseNotFoundError').mockImplementation(
    (...args: any[]) => {
      const message = args[1] ?? 'NOT_FOUND';
      throw new Error(message);
    },
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('StudentService', () => {
  it('createProfile: valida usuario y evita duplicados', async () => {
    const studentRepo = makeStudentRepo();
    const userRepo = makeUserRepo();
    const service = new StudentService({ studentRepo, userRepo });

    userRepo.get_by_id.mockResolvedValue({ id: 'u1' });
    studentRepo.existsBy.mockResolvedValue(false);
    const created = { id: 's1', userId: 'u1', age: 20, course: 'CS' } as any;
    studentRepo.createProfile.mockResolvedValue(created);

    const result = await service.createProfile({ userId: 'u1', age: 20, course: 'CS' });

    expect(userRepo.get_by_id).toHaveBeenCalledWith('u1');
    expect(studentRepo.existsBy).toHaveBeenCalledWith({ userId: 'u1' });
    expect(studentRepo.createProfile).toHaveBeenCalledWith({
      userId: 'u1',
      age: 20,
      course: 'CS',
    });
    expect(result).toBe(created);
  });

  it('createProfile: lanza error si ya existe un perfil para el usuario', async () => {
    const studentRepo = makeStudentRepo();
    const userRepo = makeUserRepo();
    const service = new StudentService({ studentRepo, userRepo });

    userRepo.get_by_id.mockResolvedValue({ id: 'u1' });
    studentRepo.existsBy.mockResolvedValue(true);

    await expect(
      service.createProfile({ userId: 'u1', age: 21, course: 'Math' }),
    ).rejects.toThrow('Student profile already exists for user');
    expect(studentRepo.createProfile).not.toHaveBeenCalled();
  });

  it('paginate: aplica valores por defecto y retorna lista', async () => {
    const studentRepo = makeStudentRepo();
    const userRepo = makeUserRepo();
    const service = new StudentService({ studentRepo, userRepo });

    studentRepo.paginate.mockResolvedValue({ items: [{ id: 's1' }], total: 1 });

    const result = await service.paginate({} as any);

    expect(studentRepo.paginate).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      filters: {
        userId: undefined,
        role: undefined,
        active: true,
        filter: undefined,
        email: undefined,
        course: undefined,
      },
    });
    expect(result).toEqual({ list: [{ id: 's1' }], total: 1 });
  });

  it('updateProfile: delega la actualización al repositorio', async () => {
    const studentRepo = makeStudentRepo();
    const userRepo = makeUserRepo();
    const service = new StudentService({ studentRepo, userRepo });

    studentRepo.updateProfile.mockResolvedValue({ id: 's1', age: 22 } as any);

    const res = await service.updateProfile('s1', { age: 22 });

    expect(studentRepo.updateProfile).toHaveBeenCalledWith('s1', { age: 22 });
    expect(res).toEqual({ id: 's1', age: 22 });
  });

  it('deleteById: elimina el perfil del estudiante', async () => {
    const studentRepo = makeStudentRepo();
    const userRepo = makeUserRepo();
    const service = new StudentService({ studentRepo, userRepo });

    studentRepo.deleteById.mockResolvedValue(true);

    const deleted = await service.deleteById('s1');

    expect(studentRepo.deleteById).toHaveBeenCalledWith('s1');
    expect(deleted).toBe(true);
  });
});
