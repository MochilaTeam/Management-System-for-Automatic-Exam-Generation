import { Includeable, ModelStatic, Transaction } from 'sequelize';

import {
    ITeacherRepository,
    ListTeachersCriteria,
} from '../../../domains/user/domain/ports/ITeacherRepository';
import {
    TeacherCreate,
    TeacherRead,
    TeacherUpdate,
} from '../../../domains/user/schemas/teacherSchema';
import { BaseRepository } from '../../../shared/domain/base_repository';
import { TeacherMapper } from '../mappers/teacherMapper';
import { Teacher, User } from '../models';

export class TeacherRepository
    extends BaseRepository<Teacher, TeacherRead, TeacherCreate, TeacherUpdate>
    implements ITeacherRepository
{
    constructor(model: ModelStatic<Teacher>, defaultTx?: Transaction) {
        super(
            model,
            TeacherMapper.toRead.bind(TeacherMapper),
            TeacherMapper.toCreateAttrs.bind(TeacherMapper),
            TeacherMapper.toUpdateAttrs.bind(TeacherMapper),
            defaultTx,
        );
    }

    static withTx(model: ModelStatic<Teacher>, tx: Transaction) {
        return new TeacherRepository(model, tx);
    }

    async createProfile(input: TeacherCreate, tx?: Transaction): Promise<TeacherRead> {
        try {
            const attrs = TeacherMapper.toCreateAttrs(input);
            const created = await this.model.create(attrs as Teacher['_creationAttributes'], {
                transaction: this.effTx(tx),
            });
            const read = await this.get_by_id(created.id, tx);
            return read!;
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async updateProfile(
        id: string,
        patch: TeacherUpdate,
        tx?: Transaction,
    ): Promise<TeacherRead | null> {
        try {
            const attrs = TeacherMapper.toUpdateAttrs(patch);
            const row = await this.model.findByPk(id, { transaction: this.effTx(tx) });
            if (!row) return null;
            await row.update(attrs, { transaction: this.effTx(tx) });
            return this.get_by_id(id, tx);
        } catch (e) {
            return this.raiseError(e, this.model.name);
        }
    }

    async get_by_id(id: string, tx?: Transaction): Promise<TeacherRead | null> {
        const row = await this.model.findByPk(id, {
            include: [{ model: User, as: 'user' }],
            transaction: this.effTx(tx),
        });
        return row ? TeacherMapper.toRead(row) : null;
    }

    async list(criteria: ListTeachersCriteria, tx?: Transaction): Promise<TeacherRead[]> {
        const opts = TeacherMapper.toOptions(criteria);
        const include: Includeable[] = opts.userWhere
            ? [{ model: User, as: 'user', where: opts.userWhere, required: true }]
            : [{ model: User, as: 'user' }];

        return this.listByOptions(
            {
                where: opts.where,
                order: opts.order,
                limit: opts.limit,
                offset: opts.offset,
                include,
            },
            tx,
        );
    }

    async paginate(criteria: ListTeachersCriteria, tx?: Transaction) {
        const opts = TeacherMapper.toOptions(criteria);
        const include: Includeable[] = opts.userWhere
            ? [{ model: User, as: 'user', where: opts.userWhere, required: true }]
            : [{ model: User, as: 'user' }];

        return this.paginateByOptions(
            {
                where: opts.where,
                order: opts.order,
                limit: opts.limit,
                offset: opts.offset,
                include,
            },
            tx,
        );
    }

    async existsBy(filters: { userId?: string }, tx?: Transaction): Promise<boolean> {
        const where = TeacherMapper.toWhereFromFilters({ userId: filters.userId }).where;
        return super.exists(where, tx);
    }

    async deleteById(id: string, tx?: Transaction): Promise<boolean> {
        return super.deleteById(id, tx);
    }
}
