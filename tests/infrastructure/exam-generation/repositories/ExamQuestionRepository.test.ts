// tests/infrastructure/exam-generation/repositories/ExamQuestionRepository.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ModelStatic, Transaction } from "sequelize";

import { ExamQuestionRepository } from "../../../../app/infrastructure/exam-generation/repositories/ExamQuestionRepository";
import ExamQuestion from "../../../../app/infrastructure/exam-generation/models/ExamQuestion";
import { ExamQuestionMapper } from "../../../../app/infrastructure/exam-generation/mappers/ExamQuestionMapper";

type ExamQuestionModelStatic = ModelStatic<ExamQuestion>;

describe("ExamQuestionRepository", () => {
  let mockModel: ExamQuestionModelStatic;
  let repo: ExamQuestionRepository;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    mockModel = {
      name: "ExamQuestion",
      destroy: vi.fn(),
      bulkCreate: vi.fn(),
      findByPk: vi.fn(),
      findOne: vi.fn(),
      // si algún día quieres dejar de mockear listByOptions/paginateByOptions,
      // aquí podrías añadir findAll / findAndCountAll
    } as unknown as ExamQuestionModelStatic;

    repo = new ExamQuestionRepository(mockModel);
  });

  // ---------- withTx ----------
  it("withTx: devuelve una instancia de ExamQuestionRepository con la transacción dada", () => {
    const tx = {} as Transaction;

    const repoWithTx = ExamQuestionRepository.withTx(mockModel, tx);

    expect(repoWithTx).toBeInstanceOf(ExamQuestionRepository);
  });

  // ---------- replaceExamQuestions ----------
  it("replaceExamQuestions: destruye las preguntas existentes y crea las nuevas", async () => {
    const examId = "exam-1";
    const questions = [
      { questionId: "q1", questionIndex: 1, questionScore: 2 },
      { questionId: "q2", questionIndex: 2, questionScore: 3 },
    ];

    const rows = [
      { examId, questionId: "q1", questionIndex: 1, questionScore: 2 },
      { examId, questionId: "q2", questionIndex: 2, questionScore: 3 },
    ];

    const effTxSpy = vi
      .spyOn(repo as any, "effTx")
      .mockReturnValue("tx" as any);

    (mockModel.destroy as any).mockResolvedValue(2);
    const toBulkAttrsSpy = vi
      .spyOn(ExamQuestionMapper, "toBulkCreateAttrs")
      .mockReturnValue(rows as any);

    (mockModel.bulkCreate as any).mockResolvedValue(rows);

    await repo.replaceExamQuestions(examId, questions);

    expect(effTxSpy).toHaveBeenCalledWith(undefined);
    expect(mockModel.destroy).toHaveBeenCalledWith({
      where: { examId },
      transaction: "tx",
    });
    expect(toBulkAttrsSpy).toHaveBeenCalledWith(examId, questions);
    expect(mockModel.bulkCreate).toHaveBeenCalledWith(rows, {
      transaction: "tx",
    });
  });

  it("replaceExamQuestions: si la lista de preguntas está vacía, solo destruye y no hace bulkCreate", async () => {
    const examId = "exam-2";
    const questions: any[] = [];

    const effTxSpy = vi
      .spyOn(repo as any, "effTx")
      .mockReturnValue("tx" as any);

    (mockModel.destroy as any).mockResolvedValue(0);

    const toBulkAttrsSpy = vi.spyOn(
      ExamQuestionMapper,
      "toBulkCreateAttrs",
    );

    await repo.replaceExamQuestions(examId, questions);

    expect(effTxSpy).toHaveBeenCalledWith(undefined);
    expect(mockModel.destroy).toHaveBeenCalledWith({
      where: { examId },
      transaction: "tx",
    });
    expect(toBulkAttrsSpy).not.toHaveBeenCalled();
    expect(mockModel.bulkCreate).not.toHaveBeenCalled();
  });

  it("replaceExamQuestions: ante error delega en raiseError", async () => {
    const examId = "exam-3";
    const questions = [
      { questionId: "q1", questionIndex: 1, questionScore: 2 },
    ];

    const effTxSpy = vi
      .spyOn(repo as any, "effTx")
      .mockReturnValue("tx" as any);

    const dbError = new Error("DB error");
    (mockModel.destroy as any).mockRejectedValue(dbError);

    const raiseErrorSpy = vi
      .spyOn(repo as any, "raiseError")
      .mockImplementation(() => {
        // no lanzamos nada para no romper el test
      });

    await repo.replaceExamQuestions(examId, questions);

    expect(effTxSpy).toHaveBeenCalledWith(undefined);
    expect(raiseErrorSpy).toHaveBeenCalledWith(dbError, mockModel.name);
  });

  // ---------- listByExamId ----------
  it("listByExamId: delega en listByOptions con where examId y orden por questionIndex ASC", async () => {
    const examId = "exam-4";

    const expectedList = [
      { id: "eq1", questionIndex: 1 },
      { id: "eq2", questionIndex: 2 },
    ] as any[];

    const listByOptionsSpy = vi
      .spyOn(repo as any, "listByOptions")
      .mockResolvedValue(expectedList);

    const result = await repo.listByExamId(examId);

    expect(listByOptionsSpy).toHaveBeenCalledWith(
      {
        where: { examId },
        order: [["questionIndex", "ASC"]],
      },
      undefined,
    );
    expect(result).toBe(expectedList);
  });

  // ---------- getById ----------
  it("getById: devuelve null si no encuentra la ExamQuestion", async () => {
    (mockModel.findByPk as any).mockResolvedValue(null);

    const result = await repo.getById("eq-1");

    expect(mockModel.findByPk).toHaveBeenCalledWith("eq-1", {
      transaction: undefined,
    });
    expect(result).toBeNull();
  });

  it("getById: devuelve ExamQuestionRead cuando encuentra la fila", async () => {
    const row = {} as ExamQuestion;
    const readObj = { id: "eq-1", questionIndex: 1 } as any;

    (mockModel.findByPk as any).mockResolvedValue(row);

    const toReadSpy = vi
      .spyOn(ExamQuestionMapper, "toRead")
      .mockReturnValue(readObj);

    const result = await repo.getById("eq-1");

    expect(mockModel.findByPk).toHaveBeenCalledWith("eq-1", {
      transaction: undefined,
    });
    expect(toReadSpy).toHaveBeenCalledWith(row);
    expect(result).toBe(readObj);
  });

  // ---------- findByExamIdAndIndex ----------
  it("findByExamIdAndIndex: devuelve null si no encuentra la fila", async () => {
    (mockModel.findOne as any).mockResolvedValue(null);

    const result = await repo.findByExamIdAndIndex("exam-1", 1);

    expect(mockModel.findOne).toHaveBeenCalledWith({
      where: { examId: "exam-1", questionIndex: 1 },
      transaction: undefined,
    });
    expect(result).toBeNull();
  });

  it("findByExamIdAndIndex: devuelve ExamQuestionRead cuando encuentra la fila", async () => {
    const row = {} as ExamQuestion;
    const readObj = {
      id: "eq-10",
      examId: "exam-1",
      questionIndex: 1,
    } as any;

    (mockModel.findOne as any).mockResolvedValue(row);

    const toReadSpy = vi
      .spyOn(ExamQuestionMapper, "toRead")
      .mockReturnValue(readObj);

    const result = await repo.findByExamIdAndIndex("exam-1", 1);

    expect(mockModel.findOne).toHaveBeenCalledWith({
      where: { examId: "exam-1", questionIndex: 1 },
      transaction: undefined,
    });
    expect(toReadSpy).toHaveBeenCalledWith(row);
    expect(result).toBe(readObj);
  });
});
