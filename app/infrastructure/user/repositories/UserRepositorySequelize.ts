import { Op } from "sequelize";
import type { IUserRepository, ListUsersCriteria, UserEntity } from "../../../domains/user/domain/ports/IUserRepository";
import { BaseSequelizeRepository } from "../../_shared/BaseSequelizeRepository";

type Deps = {
  models: {
    User: any;    // Sequelize Model de User
    Student?: any;
    Teacher?: any;
  };
  logger?: { info: (m: string, meta?: any) => void; error: (m: string, meta?: any) => void };
};

export class UserRepositorySequelize extends BaseSequelizeRepository implements IUserRepository {
  private readonly logger?: Deps["logger"];
  private readonly User: any;

  constructor({ models, logger }: Deps) {
    super(models);
    this.logger = logger;
    this.User = models.User;
  }

  async list(criteria: ListUsersCriteria) {
    const where: any = {};
    if (criteria.filters?.role) where.role = criteria.filters.role;
    if (criteria.filters?.active !== undefined) where.active = criteria.filters.active;
    if (criteria.filters?.q) {
      const like = `%${criteria.filters.q}%`;
      where[Op.or] = [{ name: { [Op.iLike]: like } }, { email: { [Op.iLike]: like } }];
    }

    const order: any[] = [];
    if (criteria.sort) order.push([criteria.sort.field, criteria.sort.dir.toUpperCase()]);

    const { rows, count } = await this.findAndCountAll(this.User, {
      where, order, limit: criteria.limit, offset: criteria.offset,
    });

    const items: UserEntity[] = rows.map((r: any) => ({
      id: r.id, name: r.name, email: r.email, role: r.role, active: r.active,
    }));

    return { items, total: count };
  }

  async getById(id: string) {
    const row = await this.findOne(this.User, { id });
    return row ? { id: row.id, name: row.name, email: row.email, role: row.role, active: row.active } : null;
  }

  async existsByEmail(email: string) {
    const row = await this.findOne(this.User, { email });
    return !!row;
  }

  async create(data: { id: string; name: string; email: string; role: any; passwordHash?: string; active?: boolean }) {
    const row = await this.User.create({
      id: data.id, name: data.name, email: data.email, role: data.role,
      passwordHash: data.passwordHash ?? null, active: data.active ?? true,
    });
    return { id: row.id, name: row.name, email: row.email, role: row.role, active: row.active };
  }

  async updatePartial(id: string, patch: Partial<Pick<UserEntity, "name" | "role" | "active">>) {
    await this.User.update(patch, { where: { id } });
    const row = await this.findOne(this.User, { id });
    if (!row) throw new Error("USER_NOT_FOUND");
    return { id: row.id, name: row.name, email: row.email, role: row.role, active: row.active };
  }

  async deleteById(id: string) {
    // soft delete recomendado
    await this.User.update({ active: false }, { where: { id } });
  }
}
