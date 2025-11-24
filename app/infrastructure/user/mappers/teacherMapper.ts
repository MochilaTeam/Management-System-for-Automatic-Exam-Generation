import type { Attributes, OrderItem, WhereOptions } from 'sequelize';
import { Op } from 'sequelize';

import { ListTeachersCriteria } from '../../../domains/user/domain/ports/ITeacherRepository';
import {
    TeacherCreate,
    TeacherRead,
    TeacherUpdate,
    teacherCreateSchema,
    teacherReadSchema,
    teacherUpdateSchema,
} from '../../../domains/user/schemas/teacherSchema';
import type { Teacher, User } from '../models';

type TeacherQueryOptions = {
    where: WhereOptions;
    userWhere?: WhereOptions;
    order: OrderItem[];
    limit: number;
    offset: number;
};

type TeacherWithUser = Teacher & {
    user?: User;
    User?: User;
};

export const TeacherMapper = {
    toRead(row: Teacher): TeacherRead {
        const p: TeacherWithUser = row.get
            ? (row.get({ plain: true }) as TeacherWithUser)
            : (row as TeacherWithUser);
        const user = p.user ?? p.User;
        if (!user) {
            throw new Error('TEACHER_USER_NOT_LOADED');
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
        if (safe.hasRoleSubjectLeader !== undefined)
            attrs.hasRoleSubjectLeader = safe.hasRoleSubjectLeader;
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
    }): { where: WhereOptions<Attributes<Teacher>>; userWhere?: WhereOptions<Attributes<User>> } {
        const where: WhereOptions<Attributes<Teacher>> = {};
        const userWhere: WhereOptions<Attributes<User>> = {};

        if (filters.userId) where.userId = filters.userId;
        if (filters.subjectLeader !== undefined) where.hasRoleSubjectLeader = filters.subjectLeader;
        if (filters.examiner !== undefined) where.hasRoleExaminer = filters.examiner;

        if (filters.email) userWhere.email = filters.email;
        if (filters.active !== undefined) userWhere.active = filters.active;
        if (filters.role) userWhere.role = filters.role;

        if (filters.filter) {
            const like = `%${filters.filter}%`;
            userWhere.name = { [Op.like]: like };
        }

        return Object.keys(userWhere).length > 0 ? { where, userWhere } : { where };
    },

    toOptions(criteria: ListTeachersCriteria): TeacherQueryOptions {
        const whereAndUser = this.toWhereFromFilters(criteria?.filters ?? {});
        const limit = criteria?.limit ?? 20;
        const offset = criteria?.offset ?? 0;

        const order: OrderItem[] = [];
        if (criteria?.sort) {
            const dir = (criteria.sort.dir ?? 'desc').toUpperCase() as 'ASC' | 'DESC';
            order.push([criteria.sort.field, dir]);
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
