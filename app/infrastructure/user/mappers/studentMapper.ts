import type { Attributes, OrderItem, WhereOptions } from 'sequelize';
import { Op } from 'sequelize';

import { ListStudentsCriteria } from '../../../domains/user/domain/ports/IStudentRepository';
import {
    StudentCreate,
    StudentUpdate,
    StudentRead,
} from '../../../domains/user/schemas/studentSchema';
import type { Student, User } from '../models';

type StudentQueryOptions = {
    where: WhereOptions;
    userWhere?: WhereOptions;
    order: OrderItem[];
    limit: number;
    offset: number;
};

export const StudentMapper = {
    toRead(row: Student): StudentRead {
        const p = row.get({ plain: true }) as {
            id: string;
            userId: string;
            age: number;
            course: string;
            user?: User;
            User?: User;
        };
        const user = p.user ?? p.User;
        if (!user) {
            throw new Error('STUDENT_USER_NOT_LOADED');
        }
        return {
            id: p.id,
            userId: p.userId,
            age: p.age,
            course: p.course,
            name: user.name,
            email: user.email,
            role: user.role,
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
        active?: boolean;
        filter?: string;
        course?: string;
        studentIds?: string[];
    }): { where: WhereOptions<Attributes<Student>>; userWhere?: WhereOptions<Attributes<User>> } {
        const where: WhereOptions<Attributes<Student>> = {};
        const userWhere: WhereOptions<Attributes<User>> = {};

        if (filters.userId) where.userId = filters.userId;
        if (filters.course) where.course = filters.course;
        if (filters.studentIds?.length) where.id = { [Op.in]: filters.studentIds };
        if (filters.email) userWhere.email = filters.email;
        if (filters.active !== undefined) userWhere.active = filters.active;
        if (filters.role) userWhere.role = filters.role;

        if (filters.filter) {
            // Búsqueda por nombre tipo LIKE %term%
            userWhere.name = { [Op.like]: `%${filters.filter}%` };
        }

        return Object.keys(userWhere).length > 0 ? { where, userWhere } : { where };
    },

    toOptions(criteria: ListStudentsCriteria): StudentQueryOptions {
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
