import { ModelStatic, Transaction, Includeable } from "sequelize";
import { Student as StudentModel, User as UserModel } from "../models";
import {
  type StudentRead,
  type StudentCreate,
  type StudentUpdate,
} from "../../../domains/user/schemas/studentSchema";
import { IStudentRepository, type ListStudentsCriteria } from "../../../domains/user/domain/ports/IStudentRepository";
import { StudentMapper } from "../mappers/studentMapper";
import { BaseRepository } from "../../../shared/domain/base_repository";

export class StudentRepository
  extends BaseRepository<StudentModel, StudentRead, StudentCreate, StudentUpdate>
  implements IStudentRepository
{
  constructor(model: ModelStatic<StudentModel>, defaultTx?: Transaction) {
    super(
      model,
      StudentMapper.toRead.bind(StudentMapper),
      StudentMapper.toCreateAttrs.bind(StudentMapper),
      StudentMapper.toUpdateAttrs.bind(StudentMapper),
      defaultTx
    );
  }

  static withTx(model: ModelStatic<StudentModel>, tx: Transaction) {
    return new StudentRepository(model, tx);
  }

  async createProfile(input: StudentCreate, tx?: Transaction): Promise<StudentRead> {
    try {
      const attrs = StudentMapper.toCreateAttrs(input);
      const created = await this.model.create(attrs as StudentModel["_creationAttributes"], {
        transaction: this.effTx(tx),
      });
      const read = await this.get_by_id(created.id, tx);
      return read!;
    } catch (e) {
      return this.raiseError(e, this.model.name);
    }
  }

  async updateProfile(id: string, patch: StudentUpdate, tx?: Transaction): Promise<StudentRead | null> {
    try {
      const attrs = StudentMapper.toUpdateAttrs(patch);
      const row = await this.model.findByPk(id, { transaction: this.effTx(tx) });
      if (!row) return null;
      await row.update(attrs, { transaction: this.effTx(tx) });
      return this.get_by_id(id, tx);
    } catch (e) {
      return this.raiseError(e, this.model.name);
    }
  }

  //Override para tener el join a user
  async get_by_id(id: string, tx?: Transaction): Promise<StudentRead | null> {
    const row = await this.model.findByPk(id, {
      include: [{ model: UserModel, as: "user" }],
      transaction: this.effTx(tx),
    });
    return row ? StudentMapper.toRead(row) : null;
  }

  async list(criteria: ListStudentsCriteria, tx?: Transaction): Promise<StudentRead[]> {
    const opts = StudentMapper.toOptions(criteria);
    const include: Includeable[] = opts.userWhere
      ? [{ model: UserModel, as: "user", where: opts.userWhere, required: true }]
      : [{ model: UserModel, as: "user" }];

    return this.listByOptions(
      {
        where: opts.where,
        order: opts.order,
        limit: opts.limit,
        offset: opts.offset,
        include,
      },
      tx
    );
  }

  async paginate(criteria: ListStudentsCriteria, tx?: Transaction) {
    const opts = StudentMapper.toOptions(criteria);
    const include: Includeable[] = opts.userWhere
      ? [{ model: UserModel, as: "user", where: opts.userWhere, required: true }]
      : [{ model: UserModel, as: "user" }];

    return this.paginateByOptions(
      {
        where: opts.where,
        order: opts.order,
        limit: opts.limit,
        offset: opts.offset,
        include,
      },
      tx
    );
  }

  async existsBy(filters: { userId?: string }, tx?: Transaction): Promise<boolean> {
    const where = StudentMapper.toWhereFromFilters({ userId: filters.userId }).where;
    return super.exists(where, tx);
  }

  async deleteById(id: string, tx?: Transaction): Promise<boolean> {
    return super.deleteById(id, tx);
  }
}
