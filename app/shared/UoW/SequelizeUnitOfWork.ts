import { Sequelize, Transaction } from "sequelize";
import { IUnitOfWork } from "./IUnitOfWork";

export class SequelizeUnitOfWork<SvcBundle> implements IUnitOfWork<SvcBundle> {
  constructor(
    private readonly sequelize: Sequelize,
    private readonly makeServices: (tx: Transaction) => SvcBundle
  ) {}

  async withTransaction<T>(work: (svc: SvcBundle) => Promise<T>): Promise<T> {
    const tx = await this.sequelize.transaction();
    try {
      const services = this.makeServices(tx);
      const out = await work(services);
      await tx.commit();
      return out;
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  }
}
