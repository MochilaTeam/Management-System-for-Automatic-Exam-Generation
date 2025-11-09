import { FindOptions, Model, ModelStatic, Transaction, WhereOptions } from "sequelize";
import {
  BaseDatabaseError,
  MultipleResultsFoundError,
  NotFoundError,
  TransactionError,
  UnexpectedError,
} from "../exceptions/domainErrors";

export class BaseRepository<
  TModel extends Model,
  TRead,
  TCreate,
  TUpdate
> {
  protected readonly model: ModelStatic<TModel>;
  protected readonly toReadFn: (row: TModel) => TRead;
  protected readonly toCreateAttrsFn: (dto: TCreate) => Record<string, unknown>;
  protected readonly toUpdateAttrsFn: (dto: TUpdate) => Record<string, unknown>;
  protected readonly defaultTx?: Transaction;

  constructor(
    model: ModelStatic<TModel>,
    toRead: (row: TModel) => TRead,
    toCreateAttrsFn: (dto: TCreate) => Record<string, unknown>,
    toUpdateAttrsFn: (dto: TUpdate) => Record<string, unknown>,
    defaultTx?: Transaction, // ← opcional, para repos “scopeados”
  ) {
    this.model = model;
    this.toReadFn = toRead;
    this.toCreateAttrsFn = toCreateAttrsFn;
    this.toUpdateAttrsFn = toUpdateAttrsFn;
    this.defaultTx = defaultTx;
  }

  protected effTx(tx?: Transaction) {
    return tx ?? this.defaultTx;
  }

  async get_one(where: WhereOptions, tx?: Transaction): Promise<TRead | null> {
    try {
      const rows = await this.model.findAll({ where, limit: 2, transaction: this.effTx(tx) } as FindOptions);
      if (rows.length > 1) {
        throw new MultipleResultsFoundError({ message: "More than one entity found" });
      }
      const row = rows[0] ?? null;
      return row ? this.toReadFn(row) : null;
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async create(data: TCreate, tx?: Transaction): Promise<TRead> {
    try {
      const attrs = this.toCreateAttrsFn(data);
      const created = await this.model.create(
        attrs as TModel["_creationAttributes"],
        { transaction: this.effTx(tx) }
      );
      return this.toReadFn(created);
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async get_by_id(id: string, tx?: Transaction): Promise<TRead | null> {
    try {
      const row = await this.model.findByPk(id, { transaction: this.effTx(tx) });
      return row ? this.toReadFn(row) : null;
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async listByOptions(options: FindOptions = {}, tx?: Transaction): Promise<TRead[]> {
    try {
      const rows = await this.model.findAll({ ...options, transaction: this.effTx(tx) });
      return rows.map((r) => this.toReadFn(r));
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async paginateByOptions(
    options: FindOptions = {},
    tx?: Transaction
  ): Promise<{ items: TRead[]; total: number }> {
    try {
      const { rows, count } = await this.model.findAndCountAll({ ...options, transaction: this.effTx(tx) });
      return { items: rows.map((r) => this.toReadFn(r)), total: count };
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async update(id: string, data: TUpdate, tx?: Transaction): Promise<TRead | null> {
    try {
      const attrs = this.toUpdateAttrsFn(data);
      const row = await this.model.findByPk(id, { transaction: this.effTx(tx) });
      if (!row) return null;
      await row.update(attrs, { transaction: this.effTx(tx) });
      return this.toReadFn(row);
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async exists(where: WhereOptions, tx?: Transaction): Promise<boolean> {
    try {
      const n = await this.model.count({ where, transaction: this.effTx(tx) });
      return n > 0;
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async deleteById(id: string, tx?: Transaction): Promise<boolean> {
    try {
      const deleted = await this.model.destroy({ where: { id } as WhereOptions, transaction: this.effTx(tx) });
      return deleted > 0;
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async count(where?: WhereOptions, tx?: Transaction): Promise<number> {
    try {
      return await this.model.count({ where: where ?? {}, transaction: this.effTx(tx) });
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  protected raiseError(error: unknown, entityName?: string): never {
    const maybe = error as { name?: string; message?: string };
    const name = maybe?.name ?? "";

    if (
      name === "SequelizeConnectionError" ||
      name === "SequelizeConnectionRefusedError" ||
      name === "SequelizeConnectionAcquireTimeoutError" ||
      name === "SequelizeHostNotFoundError" ||
      name === "SequelizeHostNotReachableError" ||
      name === "SequelizeInvalidConnectionError" ||
      name === "SequelizeConnectionTimedOutError" ||
      name === "SequelizeTimeoutError"
    ) {
      throw new TransactionError({
        message: `Error de conexión/timeout: ${maybe?.message}`,
        entity: entityName,
      });
    }

    if (name === "SequelizeDatabaseError") {
      throw new BaseDatabaseError({
        message: `Error de base de datos: ${maybe?.message}`,
        entity: entityName,
      });
    }

    if (name === "SequelizeAggregateError" || name === "AggregateError") {
      throw new UnexpectedError({
        message: `Error agregado: ${maybe?.message}`,
        entity: entityName,
      });
    }

    if (
      error instanceof NotFoundError ||
      error instanceof MultipleResultsFoundError ||
      error instanceof TransactionError ||
      error instanceof BaseDatabaseError ||
      error instanceof UnexpectedError
    ) {
      throw error;
    }

    throw new UnexpectedError({
      message: `Error inesperado: ${maybe?.message ?? String(error)}`,
      entity: entityName,
    });
  }
}
