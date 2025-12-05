// tests/infrastructure/user/repositories/StudentRepository.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ModelStatic } from "sequelize";

import { StudentRepository } from "../../../../app/infrastructure/user/repositories/StudentRepository";
import { Student as StudentModel, User as UserModel } from "../../../../app/infrastructure/user/models";
import { StudentMapper } from "../../../../app/infrastructure/user/mappers/studentMapper";
import { BaseRepository } from "../../../../app/shared/domain/base_repository";

type StudentModelStatic = ModelStatic<StudentModel>;

describe("StudentRepository", () => {
  let mockModel: StudentModelStatic;
  let repo: StudentRepository;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    mockModel = {
      name: "Student",
      create: vi.fn(),
      findByPk: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    } as unknown as StudentModelStatic;

    repo = new StudentRepository(mockModel);
  });

  // ---------- createProfile ----------
  it("createProfile: mapea attrs, crea el student y devuelve el perfil leído", async () => {
    const input: any = { userId: "user-1", career: "CS" };

    const createAttrs = { userId: "user-1", career: "CS", active: true };

    const createdRow = { id: "student-1" } as StudentModel;
    const studentRead = { id: "student-1", userId: "user-1" } as any;

    const toCreateAttrsSpy = vi
      .spyOn(StudentMapper, "toCreateAttrs")
      .mockReturnValue(createAttrs as any);

    (mockModel.create as any).mockResolvedValue(createdRow);

    const getByIdSpy = vi
      .spyOn(repo, "get_by_id")
      .mockResolvedValue(studentRead);

    const result = await repo.createProfile(input);

    expect(toCreateAttrsSpy).toHaveBeenCalledWith(input);
    expect(mockModel.create).toHaveBeenCalledWith(
      createAttrs,
      expect.objectContaining({
        transaction: undefined,
      }),
    );
    expect(getByIdSpy).toHaveBeenCalledWith("student-1", undefined);
    expect(result).toBe(studentRead);
  });

  it("createProfile: ante error delega en raiseError", async () => {
    const input: any = { userId: "user-1" };
    const dbError = new Error("DB error");

    vi.spyOn(StudentMapper, "toCreateAttrs").mockReturnValue({} as any);
    (mockModel.create as any).mockRejectedValue(dbError);

    const raiseErrorSpy = vi
      .spyOn(repo as any, "raiseError")
      .mockImplementation(() => {
        return "handled-error" as any;
      });

    const result = await repo.createProfile(input);

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe("handled-error");
  });

  // ---------- updateProfile ----------
  it("updateProfile: devuelve null si no encuentra el student", async () => {
    // evitamos que el schema de StudentMapper dispare errores por claves desconocidas
    vi.spyOn(StudentMapper, "toUpdateAttrs").mockReturnValue({} as any);

    (mockModel.findByPk as any).mockResolvedValue(null);

    const patch: any = { career: "Math" };

    const result = await repo.updateProfile("student-1", patch);

    expect(StudentMapper.toUpdateAttrs).toHaveBeenCalledWith(patch);
    expect(mockModel.findByPk).toHaveBeenCalledWith("student-1", {
      transaction: undefined,
    });
    expect(result).toBeNull();
  });

  it("updateProfile: actualiza el student y devuelve el perfil actualizado", async () => {
    const id = "student-1";
    const patch: any = { career: "Physics" };
    const updateAttrs = { career: "Physics" };

    const row = {
      update: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(StudentMapper, "toUpdateAttrs").mockReturnValue(updateAttrs as any);
    (mockModel.findByPk as any).mockResolvedValue(row);

    const studentRead = { id, career: "Physics" } as any;
    const getByIdSpy = vi
      .spyOn(repo, "get_by_id")
      .mockResolvedValue(studentRead);

    const result = await repo.updateProfile(id, patch);

    expect(StudentMapper.toUpdateAttrs).toHaveBeenCalledWith(patch);
    expect(mockModel.findByPk).toHaveBeenCalledWith(id, {
      transaction: undefined,
    });
    expect(row.update).toHaveBeenCalledWith(updateAttrs, {
      transaction: undefined,
    });
    expect(getByIdSpy).toHaveBeenCalledWith(id, undefined);
    expect(result).toBe(studentRead);
  });

  it("updateProfile: ante error delega en raiseError", async () => {
    const id = "student-1";
    const patch: any = { career: "Chemistry" };
    const dbError = new Error("DB error");

    vi.spyOn(StudentMapper, "toUpdateAttrs").mockReturnValue({} as any);
    (mockModel.findByPk as any).mockRejectedValue(dbError);

    const raiseErrorSpy = vi
      .spyOn(repo as any, "raiseError")
      .mockImplementation(() => "handled-error" as any);

    const result = await repo.updateProfile(id, patch);

    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
    expect(result).toBe("handled-error");
  });

  // ---------- get_by_id ----------
  it("get_by_id: devuelve null si no encuentra student", async () => {
    (mockModel.findByPk as any).mockResolvedValue(null);

    const result = await repo.get_by_id("student-1");

    expect(mockModel.findByPk).toHaveBeenCalledWith("student-1", {
      include: [{ model: UserModel, as: "user" }],
      transaction: undefined,
    });
    expect(result).toBeNull();
  });

  it("get_by_id: devuelve StudentRead cuando encuentra student", async () => {
    const row = {} as StudentModel;
    const studentRead = { id: "student-1" } as any;

    (mockModel.findByPk as any).mockResolvedValue(row);

    const toReadSpy = vi
      .spyOn(StudentMapper, "toRead")
      .mockReturnValue(studentRead);

    const result = await repo.get_by_id("student-1");

    expect(mockModel.findByPk).toHaveBeenCalledWith("student-1", {
      include: [{ model: UserModel, as: "user" }],
      transaction: undefined,
    });
    expect(toReadSpy).toHaveBeenCalledWith(row);
    expect(result).toBe(studentRead);
  });

  // ---------- list ----------
  it("list: sin userWhere construye include simple y delega en listByOptions", async () => {
    const criteria: any = { limit: 10 };
    const opts = {
      where: { active: true },
      order: [["createdAt", "DESC"]] as any,
      limit: 10,
      offset: 0,
      userWhere: undefined,
    };

    const toOptionsSpy = vi
      .spyOn(StudentMapper, "toOptions")
      .mockReturnValue(opts as any);

    const expectedList = [{ id: "s1" }, { id: "s2" }] as any[];
    const listByOptionsSpy = vi
      .spyOn(repo as any, "listByOptions")
      .mockResolvedValue(expectedList);

    const result = await repo.list(criteria);

    expect(toOptionsSpy).toHaveBeenCalledWith(criteria);
    expect(listByOptionsSpy).toHaveBeenCalledWith(
      {
        where: opts.where,
        order: opts.order,
        limit: opts.limit,
        offset: opts.offset,
        include: [{ model: UserModel, as: "user" }],
      },
      undefined,
    );
    expect(result).toBe(expectedList);
  });

  it("list: con userWhere construye include con where y required=true", async () => {
    const criteria: any = { search: "john" };
    const opts = {
      where: { active: true },
      order: [["createdAt", "DESC"]] as any,
      limit: 10,
      offset: 0,
      userWhere: { name: "John" },
    };

    const toOptionsSpy = vi
      .spyOn(StudentMapper, "toOptions")
      .mockReturnValue(opts as any);

    const expectedList = [{ id: "s1" }] as any[];
    const listByOptionsSpy = vi
      .spyOn(repo as any, "listByOptions")
      .mockResolvedValue(expectedList);

    const result = await repo.list(criteria);

    expect(toOptionsSpy).toHaveBeenCalledWith(criteria);
    expect(listByOptionsSpy).toHaveBeenCalledWith(
      {
        where: opts.where,
        order: opts.order,
        limit: opts.limit,
        offset: opts.offset,
        include: [
          {
            model: UserModel,
            as: "user",
            where: opts.userWhere,
            required: true,
          },
        ],
      },
      undefined,
    );
    expect(result).toBe(expectedList);
  });

  // ---------- paginate ----------
  it("paginate: sin userWhere construye include simple y delega en paginateByOptions", async () => {
    const criteria: any = { limit: 10, page: 1 };
    const opts = {
      where: { active: true },
      order: [["createdAt", "DESC"]] as any,
      limit: 10,
      offset: 0,
      userWhere: undefined,
    };

    const toOptionsSpy = vi
      .spyOn(StudentMapper, "toOptions")
      .mockReturnValue(opts as any);

    const expectedResult = { rows: [], count: 0 };
    const paginateByOptionsSpy = vi
      .spyOn(repo as any, "paginateByOptions")
      .mockResolvedValue(expectedResult);

    const result = await repo.paginate(criteria);

    expect(toOptionsSpy).toHaveBeenCalledWith(criteria);
    expect(paginateByOptionsSpy).toHaveBeenCalledWith(
      {
        where: opts.where,
        order: opts.order,
        limit: opts.limit,
        offset: opts.offset,
        include: [{ model: UserModel, as: "user" }],
      },
      undefined,
    );
    expect(result).toBe(expectedResult);
  });

  it("paginate: con userWhere construye include con where y required=true", async () => {
    const criteria: any = { search: "john", page: 2 };
    const opts = {
      where: { active: true },
      order: [["createdAt", "DESC"]] as any,
      limit: 10,
      offset: 10,
      userWhere: { name: "John" },
    };

    const toOptionsSpy = vi
      .spyOn(StudentMapper, "toOptions")
      .mockReturnValue(opts as any);

    const expectedResult = { rows: [{ id: "s1" }], count: 1 };
    const paginateByOptionsSpy = vi
      .spyOn(repo as any, "paginateByOptions")
      .mockResolvedValue(expectedResult);

    const result = await repo.paginate(criteria);

    expect(toOptionsSpy).toHaveBeenCalledWith(criteria);
    expect(paginateByOptionsSpy).toHaveBeenCalledWith(
      {
        where: opts.where,
        order: opts.order,
        limit: opts.limit,
        offset: opts.offset,
        include: [
          {
            model: UserModel,
            as: "user",
            where: opts.userWhere,
            required: true,
          },
        ],
      },
      undefined,
    );
    expect(result).toBe(expectedResult);
  });

  // ---------- existsBy ----------
  it("existsBy: usa StudentMapper.toWhereFromFilters y delega en BaseRepository.exists", async () => {
    const filters = { userId: "user-1" };

    const whereObj = { userId: "user-1", active: true };
    const toWhereSpy = vi
      .spyOn(StudentMapper, "toWhereFromFilters")
      .mockReturnValue({ where: whereObj } as any);

    const existsSpy = vi
      .spyOn(BaseRepository.prototype as any, "exists")
      .mockResolvedValue(true);

    const result = await repo.existsBy(filters);

    expect(toWhereSpy).toHaveBeenCalledWith({ userId: filters.userId });
    expect(existsSpy).toHaveBeenCalledWith(whereObj, undefined);
    expect(result).toBe(true);
  });

  // ---------- deleteById ----------
  it("deleteById: delega en BaseRepository.deleteById", async () => {
    const deleteSpy = vi
      .spyOn(BaseRepository.prototype as any, "deleteById")
      .mockResolvedValue(true);

    const result = await repo.deleteById("student-1");

    expect(deleteSpy).toHaveBeenCalledWith("student-1", undefined);
    expect(result).toBe(true);
  });
});
