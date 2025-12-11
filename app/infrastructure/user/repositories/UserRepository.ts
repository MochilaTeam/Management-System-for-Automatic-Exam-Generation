import { ModelStatic, Transaction } from 'sequelize';

import {
    IUserRepository,
    type ListUsersCriteria,
} from '../../../domains/user/domain/ports/IUserRepository';
import {
    type UserRead,
    type UserCreate,
    type UserUpdate,
    type UserAuth,
    userAuthSchema,
} from '../../../domains/user/schemas/userSchema';
import { BaseRepository } from '../../../shared/domain/base_repository';
import { UserMapper } from '../mappers/userMapper';
import { User as UserModel, Teacher } from '../models';

export class UserRepository
    extends BaseRepository<UserModel, UserRead, UserCreate, UserUpdate>
    implements IUserRepository {
    constructor(model: ModelStatic<UserModel>, defaultTx?: Transaction) {
        super(
            model,
            UserMapper.toRead.bind(UserMapper),
            UserMapper.toCreateAttrs.bind(UserMapper),
            UserMapper.toUpdateAttrs.bind(UserMapper),
            defaultTx,
        );
    }

    static withTx(model: ModelStatic<UserModel>, tx: Transaction) {
        return new UserRepository(model, tx);
    }

    async paginate(criteria: ListUsersCriteria, tx?: Transaction) {
        const opts = UserMapper.toOptions(criteria);
        return this.paginateByOptions(
            {
                where: opts.where,
                order: opts.order,
                limit: opts.limit,
                offset: opts.offset,
            },
            tx,
        );
    }

    async list(criteria: ListUsersCriteria, tx?: Transaction): Promise<UserRead[]> {
        const opts = UserMapper.toOptions(criteria);
        return this.listByOptions(
            {
                where: opts.where,
                order: opts.order,
                limit: opts.limit,
                offset: opts.offset,
            },
            tx,
        );
    }

    async existsBy(
        filters: Parameters<typeof UserMapper.toWhereFromFilters>[0],
        tx?: Transaction,
    ): Promise<boolean> {
        const where = UserMapper.toWhereFromFilters(filters);
        return super.exists(where, tx);
    }

    async findByEmailWithPassword(email: string, tx?: Transaction): Promise<UserAuth | null> {
        try {
            const row = await this.model.findOne({
                where: { email },
                transaction: this.effTx(tx),
            });
            if (!row) return null;
            const plain = row.get({ plain: true }) as {
                id: string;
                name: string;
                email: string;
                role: string;
                passwordHash: string;
                active: boolean;
            };
            return userAuthSchema.parse({
                id: plain.id,
                name: plain.name,
                email: plain.email,
                role: plain.role,
                passwordHash: plain.passwordHash,
                active: Boolean(plain.active),
            });
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async getTeacherRolesByUserId(userId: string, tx?: Transaction): Promise<{ hasRoleSubjectLeader: boolean; hasRoleExaminer: boolean } | null> {
        try {
            const teacher = await Teacher.findOne({
                where: { userId },
                transaction: this.effTx(tx),
            });
            if (!teacher) return null;

            return {
                hasRoleSubjectLeader: teacher.hasRoleSubjectLeader,
                hasRoleExaminer: teacher.hasRoleExaminer,
            };
        } catch (e) {
            return this.raiseError(e, 'Teacher');
        }
    }

    async deleteById(id: string, tx?: Transaction): Promise<boolean> {
        try {
            const [updated] = await this.model.update(
                { active: false },
                {
                    where: { id, active: true },
                    transaction: this.effTx(tx),
                },
            );
            return updated > 0;
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }
}
