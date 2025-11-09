import { Op, OrderItem, WhereOptions } from "sequelize";
import type { Teacher } from "../models";

import {
  TeacherCreate,
  TeacherRead,
  TeacherUpdate,
  teacherCreateSchema,
  teacherReadSchema,
  teacherUpdateSchema,
} from "../../../domains/user/schemas/teacherSchema";
import { ListTeachersCriteria } from "../../../domains/user/domain/ports/ITeacherRepository";

type TeacherQueryOptions = {
  where: WhereOptions;
  userWhere?: WhereOptions;
  order: OrderItem[];
  limit: number;
  offset: number;
};

export const TeacherMapper = {
  toRead(row: Teacher): TeacherRead {
    const p: any = row.get ? row.get({ plain: true }) : row;
    const user = p.user ?? p.User;
    if (!user) {
      throw new Error("TEACHER_USER_NOT_LOADED");
    }

    return teacherReadSchema.parse({
      id: p.id,
      userId: p.userId,
      specialty: p.specialty,
      hasRoleSubjectLeader: Boolean(p.hasRoleSubjectLeader),
      hasRoleExaminer: Boolean(p.hasRoleExaminer),
      name: user.name,
      email: user.email,
      role: user.role,
    });
  },

  toCreateAttrs(dto: TeacherCreate) {
    const safe = teacherCreateSchema.parse(dto);
    return {
      userId: safe.userId,
      specialty: safe.specialty,
      hasRoleSubjectLeader: safe.hasRoleSubjectLeader,
      hasRoleExaminer: safe.hasRoleExaminer,
    };
  },

  toUpdateAttrs(dto: TeacherUpdate) {
    const safe = teacherUpdateSchema.parse(dto);
    const attrs: Record<string, unknown> = {};
    if (safe.specialty !== undefined) attrs.specialty = safe.specialty;
    if (safe.hasRoleSubjectLeader !== undefined) attrs.hasRoleSubjectLeader = safe.hasRoleSubjectLeader;
    if (safe.hasRoleExaminer !== undefined) attrs.hasRoleExaminer = safe.hasRoleExaminer;
    return attrs;
  },

  toWhereFromFilters(filters: {
    userId?: string;
    email?: string;
    role?: string;
    active?: boolean;
    filter?: string;
    subjectLeader?: boolean;
    examiner?: boolean;
  }): { where: WhereOptions; userWhere?: WhereOptions } {
    const where: WhereOptions = {};
    const userWhere: WhereOptions = {};

    if (filters.userId) (where as any).userId = filters.userId;
    if (filters.subjectLeader !== undefined) (where as any).hasRoleSubjectLeader = filters.subjectLeader;
    if (filters.examiner !== undefined) (where as any).hasRoleExaminer = filters.examiner;

    if (filters.email) (userWhere as any).email = filters.email;
    if (filters.active !== undefined) (userWhere as any).active = filters.active;
    if (filters.role) (userWhere as any).role = filters.role;

    if (filters.filter) {
      const like = `%${filters.filter}%`;
      (userWhere as any).name = { [Op.like]: like };
    }

    return Object.keys(userWhere).length > 0 ? { where, userWhere } : { where };
  },

  toOptions(criteria: ListTeachersCriteria): TeacherQueryOptions {
    const whereAndUser = this.toWhereFromFilters(criteria?.filters ?? {});
    const limit = criteria?.limit ?? 20;
    const offset = criteria?.offset ?? 0;

    const order: OrderItem[] = [];
    if (criteria?.sort) {
      const dir = (criteria.sort.dir ?? "desc").toUpperCase() as "ASC" | "DESC";
      order.push([criteria.sort.field, dir]);
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
