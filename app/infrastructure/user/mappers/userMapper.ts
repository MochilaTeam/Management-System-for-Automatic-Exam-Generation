import { Op, WhereOptions, OrderItem, Attributes } from "sequelize";
import type User from "../models/User";

import {userCreateSchema,userUpdateSchema,userReadSchema,type UserCreate,type UserUpdate,type UserRead,} from "../../../domains/user/schemas/userSchema";

import {type ListUsersCriteria,type UserFilters,} from "../../../domains/user/domain/ports/IUserRepository";

export const UserMapper = {
  toRead(row: User): UserRead {
    const p = row.get({ plain: true }) as {
      id: string;
      name: string;
      email: string;
    };
    return userReadSchema.parse({
      id: p.id,
      name: p.name,
      email: p.email,
    });
  },

  toCreateAttrs(dto: UserCreate): Record<string, unknown> {
    const safe = userCreateSchema.parse(dto);
    return {
      name: safe.name,
      email: safe.email,
      passwordHash: safe.passwordHash,
    };
  },

  toUpdateAttrs(dto: UserUpdate): Record<string, unknown> {
    const safe = userUpdateSchema.parse(dto);
    const attrs: Record<string, unknown> = {};
    if (safe.name !== undefined) attrs.name = safe.name;
    if (safe.email !== undefined) attrs.email = safe.email;
    if (safe.passwordHash !== undefined) attrs.passwordHash = safe.passwordHash;
    return attrs;
  },

  toWhereFromFilters(filters?: UserFilters): WhereOptions<Attributes<User>> {
    const where: WhereOptions<Attributes<User>> = {};
    if (!filters) return where;

    if (filters.role !== undefined)   where.role   = filters.role;
    if (filters.active !== undefined) where.active = filters.active;
    if (filters.email)                where.email  = filters.email;

    if (filters.q) {
      const like = `%${filters.q}%`;
      (where as any)[Op.or] = [
        { name:  { [Op.like]: like } },
        { email: { [Op.like]: like } },
      ];
    }
    return where;
  },

  toOptions(criteria: ListUsersCriteria): {
    where: WhereOptions;
    order: OrderItem[];
    limit: number;
    offset: number;
  } {
    const where = this.toWhereFromFilters(criteria.filters);
    const limit  = criteria.limit  ?? 20;
    const offset = criteria.offset ?? 0;

    const order: OrderItem[] = [];
    if (criteria.sort) {
      const dir = (criteria.sort.dir ?? "DESC").toUpperCase() as "ASC" | "DESC";
      order.push([criteria.sort.field, dir]);
    } else {
      order.push(["createdAt", "DESC"]);
    }

    return { where, order, limit, offset };
  },
};
