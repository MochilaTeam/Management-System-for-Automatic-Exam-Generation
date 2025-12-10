// tests/infrastructure/exam-generation/repositories/ExamRepository.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ModelStatic, Transaction } from "sequelize";

import { ExamRepository } from "../../../../app/infrastructure/exam-generation/repositories/ExamRepository";
import Exam from "../../../../app/infrastructure/exam-generation/models/Exam";
import { ExamMapper } from "../../../../app/infrastructure/exam-generation/mappers/ExamMapper";

type ExamModelStatic = ModelStatic<Exam>;

describe("ExamRepository", () => {
  let mockModel: ExamModelStatic;
  let repo: ExamRepository;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    // Mock mínimo del modelo de Sequelize que podría necesitar el BaseRepository
    mockModel = {
      name: "Exam",
      // si en algún momento quieres dejar de mockear paginateByOptions/listByOptions,
      // aquí puedes añadir findAll / findAndCountAll:
      // findAll: vi.fn(),
      // findAndCountAll: vi.fn(),
    } as unknown as ExamModelStatic;

    repo = new ExamRepository(mockModel);
  });

  // ---------- withTx ----------
  it("withTx: devuelve una instancia de ExamRepository con la transacción dada", () => {
    const tx = {} as Transaction;

    const repoWithTx = ExamRepository.withTx(mockModel, tx);

    expect(repoWithTx).toBeInstanceOf(ExamRepository);
    // No podemos acceder al tx interno porque lo maneja BaseRepository,
    // pero al menos comprobamos que no explota y crea la instancia correcta.
  });

  // ---------- paginate ----------
  it("paginate: usa ExamMapper.toOptions y delega en paginateByOptions (sin tx)", async () => {
    const criteria: any = { page: 2, limit: 10, subjectId: "subj-1" };

    const opts = {
      where: { subjectId: "subj-1" },
      order: [["createdAt", "DESC"]] as any,
      limit: 10,
      offset: 10,
    };

    const toOptionsSpy = vi
      .spyOn(ExamMapper, "toOptions")
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
      },
      undefined, // tx
    );
    expect(result).toBe(expectedResult);
  });

  it("paginate: pasa también la transacción a paginateByOptions cuando se proporciona", async () => {
    const criteria: any = { page: 1, limit: 5 };
    const tx = {} as Transaction;

    const opts = {
      where: { active: true },
      order: [["createdAt", "ASC"]] as any,
      limit: 5,
      offset: 0,
    };

    const toOptionsSpy = vi
      .spyOn(ExamMapper, "toOptions")
      .mockReturnValue(opts as any);

    const expectedResult = { rows: [{ id: "exam-1" }], count: 1 };
    const paginateByOptionsSpy = vi
      .spyOn(repo as any, "paginateByOptions")
      .mockResolvedValue(expectedResult);

    const result = await repo.paginate(criteria, tx);

    expect(toOptionsSpy).toHaveBeenCalledWith(criteria);
    expect(paginateByOptionsSpy).toHaveBeenCalledWith(
      {
        where: opts.where,
        order: opts.order,
        limit: opts.limit,
        offset: opts.offset,
      },
      tx,
    );
    expect(result).toBe(expectedResult);
  });

  // ---------- list ----------
  it("list: usa ExamMapper.toOptions y delega en listByOptions (sin tx)", async () => {
    const criteria: any = { limit: 20 };

    const opts = {
      where: { active: true },
      order: [["createdAt", "DESC"]] as any,
      limit: 20,
      offset: 0,
    };

    const toOptionsSpy = vi
      .spyOn(ExamMapper, "toOptions")
      .mockReturnValue(opts as any);

    const expectedList = [{ id: "e1" }, { id: "e2" }] as any[];
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
      },
      undefined,
    );
    expect(result).toBe(expectedList);
  });

  it("list: pasa también la transacción a listByOptions cuando se proporciona", async () => {
    const criteria: any = { limit: 10, page: 3 };
    const tx = {} as Transaction;

    const opts = {
      where: { subjectId: "subj-2" },
      order: [["createdAt", "ASC"]] as any,
      limit: 10,
      offset: 20,
    };

    const toOptionsSpy = vi
      .spyOn(ExamMapper, "toOptions")
      .mockReturnValue(opts as any);

    const expectedList = [{ id: "e3" }] as any[];
    const listByOptionsSpy = vi
      .spyOn(repo as any, "listByOptions")
      .mockResolvedValue(expectedList);

    const result = await repo.list(criteria, tx);

    expect(toOptionsSpy).toHaveBeenCalledWith(criteria);
    expect(listByOptionsSpy).toHaveBeenCalledWith(
      {
        where: opts.where,
        order: opts.order,
        limit: opts.limit,
        offset: opts.offset,
      },
      tx,
    );
    expect(result).toBe(expectedList);
  });
});
