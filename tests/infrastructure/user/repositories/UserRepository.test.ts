// tests/infrastructure/user/repositories/UserRepository.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ModelStatic } from "sequelize";

import { UserRepository } from "../../../../app/infrastructure/user/repositories/UserRepository";
import { User as UserModel } from "../../../../app/infrastructure/user/models";
import { UserMapper } from "../../../../app/infrastructure/user/mappers/userMapper";

// Pequeño helper de tipo, por si el import de UserModel es raro
type UserModelStatic = ModelStatic<UserModel>;

describe("UserRepository", () => {
  let mockModel: UserModelStatic;
  let repo: UserRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock mínimo del modelo sequelize que necesitamos
    mockModel = {
      name: "User",
      findOne: vi.fn(),
      update: vi.fn(),
      count: vi.fn(), // necesario para BaseRepository.exists
      // si tu BaseRepository usa estos, puedes añadirlos:
      // findAll: vi.fn(),
      // findAndCountAll: vi.fn(),
    } as unknown as UserModelStatic;

    repo = new UserRepository(mockModel);
  });

  // ---------- paginate ----------
  it("paginate: usa UserMapper.toOptions y delega en paginateByOptions", async () => {
    const criteria: any = { page: 2, limit: 10, search: "john" };

    const mappedOptions = {
      where: { name: "John" },
      order: [["name", "ASC"]],
      limit: 10,
      offset: 10,
    };

    const toOptionsSpy = vi
      .spyOn(UserMapper, "toOptions")
      .mockReturnValue(mappedOptions as any);

    const expectedResult = { rows: [], count: 0 };
    const paginateByOptionsSpy = vi
      .spyOn(repo as any, "paginateByOptions")
      .mockResolvedValue(expectedResult);

    const result = await repo.paginate(criteria);

    expect(toOptionsSpy).toHaveBeenCalledWith(criteria);
    expect(paginateByOptionsSpy).toHaveBeenCalledWith(
      {
        where: mappedOptions.where,
        order: mappedOptions.order,
        limit: mappedOptions.limit,
        offset: mappedOptions.offset,
      },
      undefined, // tx
    );
    expect(result).toBe(expectedResult);
  });

  // ---------- list ----------
  it("list: usa UserMapper.toOptions y delega en listByOptions", async () => {
    const criteria: any = { limit: 5 };

    const mappedOptions = {
      where: { active: true },
      order: [["createdAt", "DESC"]],
      limit: 5,
      offset: 0,
    };

    const toOptionsSpy = vi
      .spyOn(UserMapper, "toOptions")
      .mockReturnValue(mappedOptions as any);

    const expectedUsers: any[] = [{ id: "1" }, { id: "2" }];
    const listByOptionsSpy = vi
      .spyOn(repo as any, "listByOptions")
      .mockResolvedValue(expectedUsers);

    const result = await repo.list(criteria);

    expect(toOptionsSpy).toHaveBeenCalledWith(criteria);
    expect(listByOptionsSpy).toHaveBeenCalledWith(
      {
        where: mappedOptions.where,
        order: mappedOptions.order,
        limit: mappedOptions.limit,
        offset: mappedOptions.offset,
      },
      undefined,
    );
    expect(result).toBe(expectedUsers);
  });

  // ---------- existsBy ----------
  it("existsBy: mapea filtros y consulta count en el modelo", async () => {
    const filters: any = { email: "test@example.com" };
    const where = { email: "test@example.com", active: true };

    const toWhereSpy = vi
      .spyOn(UserMapper, "toWhereFromFilters")
      .mockReturnValue(where as any);

    // simulamos que hay 1 registro que cumple el where
    (mockModel.count as any).mockResolvedValue(1);

    const result = await repo.existsBy(filters);

    expect(toWhereSpy).toHaveBeenCalledWith(filters);
    // verificamos que count se llamó una vez
    const countMock = mockModel.count as any;
    expect(countMock).toHaveBeenCalledTimes(1);

    const [options] = countMock.mock.calls[0];
    expect(options.where).toEqual(where);
    expect(result).toBe(true);
  });

  // ---------- findByEmailWithPassword ----------
  it("findByEmailWithPassword: devuelve null si no encuentra usuario", async () => {
    (mockModel.findOne as any).mockResolvedValue(null);

    const result = await repo.findByEmailWithPassword("no@existe.com");

    expect(mockModel.findOne).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("findByEmailWithPassword: devuelve UserAuth mapeado correctamente", async () => {
    const fakePlain = {
      id: "123e4567-e89b-12d3-a456-426614174000", // UUID válido
      name: "John Doe",
      email: "john@example.com",
      role: "teacher",
      passwordHash: "hash123",
      active: 1, // truthy
    };

    const fakeRow = {
      get: vi.fn().mockReturnValue(fakePlain),
    };

    (mockModel.findOne as any).mockResolvedValue(fakeRow);

    const result = await repo.findByEmailWithPassword("john@example.com");

    expect(mockModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "john@example.com" },
        // transaction: algo
      }),
    );

    expect(fakeRow.get).toHaveBeenCalledWith({ plain: true });

    // Y que el resultado sea un UserAuth válido
    expect(result).toMatchObject({
      id: fakePlain.id,
      name: fakePlain.name,
      email: fakePlain.email,
      role: fakePlain.role,
      passwordHash: fakePlain.passwordHash,
      active: true,
    });
  });

  it("findByEmailWithPassword: ante error delega en raiseError", async () => {
    const dbError = new Error("DB down");
    (mockModel.findOne as any).mockRejectedValue(dbError);

    const raiseErrorSpy = vi
      .spyOn(repo as any, "raiseError")
      .mockImplementation((...args: unknown[]) => {
        const [err] = args;
        // Simulamos que raiseError relanza el error
        throw err;
      });

    await expect(
      repo.findByEmailWithPassword("john@example.com"),
    ).rejects.toThrow("DB down");

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
  });

  // ---------- deleteById ----------
  it("deleteById: devuelve true si se actualiza al menos una fila", async () => {
    (mockModel.update as any).mockResolvedValue([1]);

    const result = await repo.deleteById("user-1");

    expect(mockModel.update).toHaveBeenCalledWith(
      { active: false },
      expect.objectContaining({
        where: { id: "user-1", active: true },
        // transaction: algo
      }),
    );

    expect(result).toBe(true);
  });

  it("deleteById: devuelve false si no se actualiza ninguna fila", async () => {
    (mockModel.update as any).mockResolvedValue([0]);

    const result = await repo.deleteById("user-2");

    expect(result).toBe(false);
  });

  it("deleteById: ante error delega en raiseError", async () => {
    const dbError = new Error("constraint error");
    (mockModel.update as any).mockRejectedValue(dbError);

    const raiseErrorSpy = vi
      .spyOn(repo as any, "raiseError")
      .mockReturnValue(false); // o lanzar, depende de tu diseño

    const result = await repo.deleteById("user-3");

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe(false);
  });
});
