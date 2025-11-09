import { ModelStatic, Transaction } from "sequelize";
import { User as UserModel } from "../models";
import {
  type UserRead,
  type UserCreate,
  type UserUpdate,
} from "../../../domains/user/schemas/userSchema";
import { IUserRepository, type ListUsersCriteria } from "../../../domains/user/domain/ports/IUserRepository";
import { BaseRepository } from "../../../shared/domain/base_repository";
import { UserMapper } from "../mappers/userMapper";

export class UserRepository
  extends BaseRepository<UserModel, UserRead, UserCreate, UserUpdate>
  implements IUserRepository
{
  constructor(model: ModelStatic<UserModel>, defaultTx?: Transaction) {
    super(
      model,
      UserMapper.toRead.bind(UserMapper),
      UserMapper.toCreateAttrs.bind(UserMapper),
      UserMapper.toUpdateAttrs.bind(UserMapper),
      defaultTx
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
      tx
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
      tx
    );
  }

  async existsBy(filters: Parameters<typeof UserMapper.toWhereFromFilters>[0], tx?: Transaction): Promise<boolean> {
    const where = UserMapper.toWhereFromFilters(filters);
    return super.exists(where, tx);
  }

}
