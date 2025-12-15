import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';

vi.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: { sign: vi.fn() },
}));

vi.mock('../../../app/core/config/jwt', () => ({
  __esModule: true,
  get_jwt_config: vi.fn(() => ({
    accessSecret: 'secret',
    issuer: 'issuer',
    audience: 'aud',
    expiresIn: '1h',
  })),
}));

import { UserService } from '../../../app/domains/user/domain/services/userService';
import { Roles } from '../../../app/shared/enums/rolesEnum';
import { UnauthorizedError } from '../../../app/shared/exceptions/domainErrors';

import jwtMock from 'jsonwebtoken';
import { get_jwt_config } from '../../../app/core/config/jwt';

const makeRepo = () =>
  ({
    existsBy: vi.fn(),
    create: vi.fn(),
    paginate: vi.fn(),
    get_by_id: vi.fn(),
    update: vi.fn(),
    deleteById: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    getTeacherRolesByUserId: vi.fn(),
  } as any);

const makeHasher = () =>
  ({
    hash: vi.fn(),
    compare: vi.fn(),
  } as any);

beforeAll(() => {
  vi.spyOn(UserService.prototype as any, 'raiseBusinessRuleError').mockImplementation(
    (...args: any[]) => {
      const message = args[1] ?? 'BUSINESS_RULE_ERROR';
      throw new Error(message);
    },
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('UserService', () => {
  it('create: normaliza email, hashea password y crea usuario', async () => {
    const repo = makeRepo();
    const hasher = makeHasher();
    const service = new UserService({ repo, hasher });

    repo.existsBy.mockResolvedValue(false);
    hasher.hash.mockResolvedValue('hashed-pw');
    const created = { id: 'u1', name: 'John', email: 'john@test.com', role: Roles.ADMIN } as any;
    repo.create.mockResolvedValue(created);

    const result = await service.create({
      name: '  John  ',
      email: '  JOHN@test.com  ',
      password: 'secret',
      role: Roles.ADMIN,
    } as any);

    expect(repo.existsBy).toHaveBeenCalledWith({ email: 'john@test.com' });
    expect(hasher.hash).toHaveBeenCalledWith('secret');
    expect(repo.create).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@test.com',
      passwordHash: 'hashed-pw',
      role: Roles.ADMIN,
    });
    expect(result).toBe(created);
  });

  it('create: lanza error cuando el email ya está tomado', async () => {
    const repo = makeRepo();
    const hasher = makeHasher();
    const service = new UserService({ repo, hasher });

    repo.existsBy.mockResolvedValue(true);

    await expect(
      service.create({
        name: 'Test',
        email: 'test@test.com',
        password: 'pw',
        role: Roles.TEACHER,
      } as any),
    ).rejects.toThrow('Email already in use');
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('paginate: usa defaults de limit/offset y active', async () => {
    const repo = makeRepo();
    const service = new UserService({ repo, hasher: makeHasher() });

    repo.paginate.mockResolvedValue({ items: [{ id: 'u1' }], total: 1 });

    const result = await service.paginate({ role: Roles.STUDENT, filter: 'john' } as any);

    expect(repo.paginate).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      filters: {
        role: Roles.STUDENT,
        active: true,
        email: undefined,
        q: 'john',
      },
    });
    expect(result).toEqual({ list: [{ id: 'u1' }], total: 1 });
  });

  it('update: devuelve null si el usuario no existe', async () => {
    const repo = makeRepo();
    const service = new UserService({ repo, hasher: makeHasher() });

    repo.get_by_id.mockResolvedValue(null);

    const result = await service.update('u1', { name: 'New' });

    expect(result).toBeNull();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('update: lanza error si se intenta usar un email duplicado', async () => {
    const repo = makeRepo();
    const hasher = makeHasher();
    const service = new UserService({ repo, hasher });

    repo.get_by_id.mockResolvedValue({ id: 'u1', email: 'old@mail.com' });
    repo.existsBy.mockResolvedValue(true);

    await expect(
      service.update('u1', { email: 'new@mail.com' }),
    ).rejects.toThrow('Email already in use');
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('loginUser: valida credenciales y genera token', async () => {
    const repo = makeRepo();
    const hasher = makeHasher();
    const service = new UserService({ repo, hasher });

    const userWithHash = {
      id: 'u1',
      email: 'john@test.com',
      name: 'John',
      role: Roles.ADMIN,
      passwordHash: 'hashed',
      active: true,
    };
    repo.findByEmailWithPassword.mockResolvedValue(userWithHash);
    hasher.compare.mockResolvedValue(true);
    (jwtMock as any).sign.mockReturnValue('signed-token');

    const result = await service.loginUser({
      email: '  JOHN@test.com ',
      password: 'pw',
    } as any);

    expect(repo.findByEmailWithPassword).toHaveBeenCalledWith('john@test.com');
    expect(hasher.compare).toHaveBeenCalledWith('pw', 'hashed');
    expect((jwtMock as any).sign).toHaveBeenCalled();
    expect(get_jwt_config).toHaveBeenCalled();
    expect(result).toEqual({
      user: { id: 'u1', email: 'john@test.com', name: 'John', role: Roles.ADMIN },
      token: 'signed-token',
    });
  });

  it('loginUser: lanza UnauthorizedError si la contraseña no coincide', async () => {
    const repo = makeRepo();
    const hasher = makeHasher();
    const service = new UserService({ repo, hasher });

    repo.findByEmailWithPassword.mockResolvedValue({
      id: 'u1',
      email: 'john@test.com',
      name: 'John',
      role: Roles.ADMIN,
      passwordHash: 'hashed',
      active: true,
    });
    hasher.compare.mockResolvedValue(false);

    await expect(
      service.loginUser({ email: 'john@test.com', password: 'bad' } as any),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('update: hashea contraseña y actualiza rol cuando se envían', async () => {
    const repo = makeRepo();
    const hasher = makeHasher();
    const service = new UserService({ repo, hasher });

    repo.get_by_id.mockResolvedValue({ id: 'u1', email: 'old@mail.com', role: Roles.STUDENT });
    repo.existsBy.mockResolvedValue(false);
    hasher.hash.mockResolvedValue('new-hash');
    repo.update.mockResolvedValue({ id: 'u1', email: 'new@mail.com', role: Roles.TEACHER });

    const result = await service.update('u1', {
      email: 'New@mail.com',
      password: 'pw',
      role: Roles.TEACHER,
    });

    expect(hasher.hash).toHaveBeenCalledWith('pw');
    expect(repo.update).toHaveBeenCalledWith('u1', {
      email: 'new@mail.com',
      passwordHash: 'new-hash',
      role: Roles.TEACHER,
    });
    expect(result?.role).toBe(Roles.TEACHER);
  });

  it('loginUser: agrega roles de docente cuando corresponde', async () => {
    const repo = makeRepo();
    const hasher = makeHasher();
    const service = new UserService({ repo, hasher });

    const userWithHash = {
      id: 'u1',
      email: 'john@test.com',
      name: 'John',
      role: Roles.TEACHER,
      passwordHash: 'hashed',
      active: true,
    };
    repo.findByEmailWithPassword.mockResolvedValue(userWithHash);
    repo.getTeacherRolesByUserId.mockResolvedValue({
      hasRoleSubjectLeader: true,
      hasRoleExaminer: true,
    });
    hasher.compare.mockResolvedValue(true);
    (jwtMock as any).sign.mockReturnValue('teacher-token');

    const result = await service.loginUser({
      email: 'john@test.com',
      password: 'pw',
    } as any);

    expect(repo.getTeacherRolesByUserId).toHaveBeenCalledWith('u1');
    expect((jwtMock as any).sign).toHaveBeenCalled();
    expect(result.user.role).toBe(Roles.TEACHER);
  });

  it('loginUser: rechaza usuarios inactivos', async () => {
    const repo = makeRepo();
    const hasher = makeHasher();
    const service = new UserService({ repo, hasher });

    repo.findByEmailWithPassword.mockResolvedValue({
      id: 'u1',
      email: 'john@test.com',
      name: 'John',
      role: Roles.STUDENT,
      passwordHash: 'hashed',
      active: false,
    });

    await expect(
      service.loginUser({ email: 'john@test.com', password: 'pw' } as any),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
