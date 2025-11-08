import type Student from "../models/Student";
import {
  StudentCreate,
  StudentUpdate,
  StudentRead,
} from "../../../domains/user/schemas/studentSchema";
import { WhereOptions, OrderItem, Op } from "sequelize";
import { ListStudentsCriteria } from "../../../domains/user/domain/ports/IStudentRepository";

type StudentQueryOptions = {
  where: WhereOptions;
  userWhere?: WhereOptions;
  order: OrderItem[];
  limit: number;
  offset: number;
};

export const StudentMapper = {
  toRead(row: Student): StudentRead {
    const p: any = row.get ? row.get({ plain: true }) : (row as any);
    return {
      id: p.id,
      userId: p.userId,
      age: p.age,
      course: p.course,
      name: p.User?.name ?? p.name,
      email: p.User?.email ?? p.email,
    };
  },

  toCreateAttrs(dto: StudentCreate) {
    return {
      userId: dto.userId,
      age: dto.age,
      course: dto.course,
    };
  },

  toUpdateAttrs(dto: StudentUpdate) {
    const out: Record<string, unknown> = {};
    if (dto.age !== undefined) out.age = dto.age;
    if (dto.course !== undefined) out.course = dto.course;
    return out;
  },

  toWhereFromFilters(filters: {
    userId?: string;
    email?: string;
    role?: string;
    filter?: string; 
  }): { where: WhereOptions; userWhere?: WhereOptions } {
    const where: WhereOptions = {};
    const userWhere: WhereOptions = {};

    if (filters.userId) (where as any).userId = filters.userId;
    if (filters.email) (userWhere as any).email = filters.email;
    if (filters.role) (userWhere as any).role = filters.role;

    if (filters.filter) {
      // Búsqueda por nombre tipo LIKE %term%
      (userWhere as any).name = { [Op.like]: `%${filters.filter}%` };
    }

    return Object.keys(userWhere).length > 0 ? { where, userWhere } : { where };
  },

  toOptions(criteria: ListStudentsCriteria): StudentQueryOptions {
    const whereAndUser = this.toWhereFromFilters(criteria?.filters ?? {});
    const limit = criteria?.limit ?? 20;
    const offset = criteria?.offset ?? 0;

    const order: OrderItem[] = [];
    if (criteria?.sort) {
      order.push([criteria.sort.field, (criteria.sort.dir ?? "desc").toUpperCase() as any]);
    } else {
      order.push(["createdAt", "DESC"]);
    }

    return {
      where: whereAndUser.where,
      userWhere: whereAndUser.userWhere,
      order,
      limit,
      offset,
    };
  },
};
