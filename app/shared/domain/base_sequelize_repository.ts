import type { Model, WhereOptions, FindOptions } from "sequelize";

export type SequelizeModels = Record<string, Model<any, any>>;

export abstract class BaseSequelizeRepository {
  protected readonly models: SequelizeModels;
  constructor(models: SequelizeModels) { this.models = models; }

  protected async findOne<M extends Model>(model: any, where: WhereOptions, options: Omit<FindOptions, "where"> = {}) {
    return model.findOne({ where, ...options }) as Promise<M | null>;
  }

  protected async findAndCountAll<M extends Model>(model: any, options: FindOptions) {
    return model.findAndCountAll(options) as Promise<{ rows: M[]; count: number }>;
  }
}
