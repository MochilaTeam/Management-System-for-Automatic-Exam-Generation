import { FindOptions, Model, ModelStatic, WhereOptions } from "sequelize";
import {
  BaseDatabaseError,
  MultipleResultsFoundError,
  NotFoundError,
  TransactionError,
  UnexpectedError,
} from "../exceptions/domainErrors";

export class BaseRepository<TModel extends Model,TRead,TCreate,TUpdate>{
  protected readonly model: ModelStatic<TModel>;
  protected readonly toReadFn: (row: TModel) => TRead;
  protected readonly toCreateAttrsFn: (dto: TCreate) => Record<string, unknown>;
  protected readonly toUpdateAttrsFn: (dto: TUpdate) => Record<string, unknown>;

  constructor(
    model: ModelStatic<TModel>,
    toRead: (row: TModel) => TRead,
    toCreateAttrsFn: (dto: TCreate) => Record<string, unknown>,
    toUpdateAttrsFn: (dto: TUpdate) => Record<string, unknown>
  ){
    this.model = model;
    this.toReadFn = toRead;
    this.toCreateAttrsFn = toCreateAttrsFn;
    this.toUpdateAttrsFn = toUpdateAttrsFn;
  }

  async get_one(where: WhereOptions): Promise<TRead | null> {
    try {
      const rows = await this.model.findAll({ where, limit: 2 } as FindOptions);
      if (rows.length > 1) {
        throw new MultipleResultsFoundError({ message: "More than one entity found" });
      }
      const row = rows[0] ?? null;
      return row ? this.toReadFn(row) : null;
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async create(data: TCreate): Promise<TRead> {
    try {
      const attrs = this.toCreateAttrsFn(data);
      const created = await this.model.create(attrs as TModel["_creationAttributes"]);
      return this.toReadFn(created);
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async get_by_id(id: string): Promise<TRead | null> {
    try {
      const row = await this.model.findByPk(id);
      return row ? this.toReadFn(row) : null;
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async listByOptions(options: FindOptions = {}): Promise<TRead[]> {
    try {
      const rows = await this.model.findAll(options);
      return rows.map((r) => this.toReadFn(r));
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async paginateByOptions(options: FindOptions = {}): Promise<{ items: TRead[]; total: number }> {
    try {
      const { rows, count } = await this.model.findAndCountAll(options);
      return { items: rows.map((r) => this.toReadFn(r)), total: count };
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async update(id: string, data: TUpdate): Promise<TRead | null> {
    try {
      const attrs = this.toUpdateAttrsFn(data);
      const row = await this.model.findByPk(id);
      if (!row) return null;
      await row.update(attrs);
      return this.toReadFn(row);
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async exists(where: WhereOptions): Promise<boolean> {
    try {
      const n = await this.model.count({ where });
      return n > 0;
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const deleted = await this.model.destroy({ where: { id } as WhereOptions });
      return deleted > 0;
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  async count(where?: WhereOptions): Promise<number> {
    try {
      return await this.model.count({ where: where ?? {} });
    } catch (e) {
      this.raiseError(e, this.model.name);
    }
  }

  // Normaliza errores de Sequelize a errores de dominio. 
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
