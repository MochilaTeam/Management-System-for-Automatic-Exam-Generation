import {
  ModelStatic,
  Transaction,
  WhereOptions,
  FindOptions,
  Includeable,
} from "sequelize";
import type StudentModel from "../models/Student";
import UserModel from "../models/User";
import {
  StudentCreate,   
  StudentUpdate,  
  StudentRead,
  ListStudents,   
} from "../../../domains/user/schemas/studentSchema";
import { IStudentRepository } from "../../../domains/user/domain/ports/IStudentRepository";
import { StudentMapper } from "../mappers/studentMapper";

type CreationAttrs = StudentModel["_creationAttributes"];
type UpdateAttrs   = Partial<StudentModel["_attributes"]>;

export class StudentRepository implements IStudentRepository {
  constructor(
    private readonly model: ModelStatic<StudentModel>,
    private readonly tx?: Transaction
  ) {}

  static withTx(model: ModelStatic<StudentModel>, tx: Transaction) {
    return new StudentRepository(model, tx);
  }

  async createProfile(input: StudentCreate): Promise<StudentRead> {
    const attrs: CreationAttrs = StudentMapper.toCreateAttrs(input) as CreationAttrs;

    const row = await this.model.create(attrs, { transaction: this.tx });

    const reloaded = await this.model.findByPk(row.get("id") as string, {
      include: [UserModel],
      transaction: this.tx,
    });

    return StudentMapper.toRead(reloaded ?? row);
  }

  async updateProfile(id: string, patch: StudentUpdate): Promise<StudentRead | null> {
    const current = await this.model.findByPk(id, { transaction: this.tx });
    if (!current) return null;

    const attrs: UpdateAttrs = StudentMapper.toUpdateAttrs(patch) as UpdateAttrs;
    await current.update(attrs, { transaction: this.tx });

    const reloaded = await this.model.findByPk(id, {
      include: [UserModel],
      transaction: this.tx,
    });

    return reloaded ? StudentMapper.toRead(reloaded) : null;
  }

  async get_by_id(id: string): Promise<StudentRead | null> {
    const row = await this.model.findByPk(id, {
      include: [UserModel],
      transaction: this.tx,
    });
    return row ? StudentMapper.toRead(row) : null;
  }

  async list(criteria: ListStudents): Promise<StudentRead[]> {
    const opts = StudentMapper.toOptions(criteria);

    const include: Includeable[] = opts.userWhere
      ? [{ model: UserModel, where: opts.userWhere, required: true }]
      : [{ model: UserModel }];

    const options: FindOptions = {
      where: opts.where,
      order: opts.order,
      limit: opts.limit,
      offset: opts.offset,
      include,
      transaction: this.tx,
    };

    const rows = await this.model.findAll(options);
    return rows.map(StudentMapper.toRead);
  }

  async paginate(criteria: ListStudents) {
    const opts = StudentMapper.toOptions(criteria);

    const include: Includeable[] = opts.userWhere
      ? [{ model: UserModel, where: opts.userWhere, required: true }]
      : [{ model: UserModel }];

    const options: FindOptions = {
      where: opts.where,
      order: opts.order,
      limit: opts.limit,
      offset: opts.offset,
      include,
      transaction: this.tx,
    };

    const { rows, count } = await this.model.findAndCountAll(options);

    return {
      items: rows.map(StudentMapper.toRead),
      total: count,
      limit: opts.limit,
      offset: opts.offset,
    };
  }

  async existsBy(filters: { userId?: string }): Promise<boolean> {
    const where: WhereOptions = {};
    if (filters.userId) (where as any).userId = filters.userId; 

    const row = await this.model.findOne({ where, transaction: this.tx });
    return !!row;
  }

  async deleteById(id: string): Promise<boolean> {
    const n = await this.model.destroy({ where: { id }, transaction: this.tx });
    return n > 0;
  }
}
