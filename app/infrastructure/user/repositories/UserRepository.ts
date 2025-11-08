import { ModelStatic, Transaction } from "sequelize";
import { BaseRepository } from "../../../shared/domain/base_repository";

import type {UserCreate,UserUpdate,UserRead,} from "../../../domains/user/schemas/userSchema";

import type {IUserRepository,ListUsersCriteria,UserFilters,} from "../../../domains/user/domain/ports/IUserRepository";

import User from "../models/User";
import { UserMapper } from "../mappers/userMapper";

export class UserRepository
  extends BaseRepository<User, UserRead, UserCreate, UserUpdate>
  implements IUserRepository
{
    constructor(model: ModelStatic<User>,tx?:Transaction) {
        super(
        model,
        UserMapper.toRead,         
        UserMapper.toCreateAttrs,  
        UserMapper.toUpdateAttrs,  
        );
    }   

    async list(criteria: ListUsersCriteria): Promise<UserRead[]> {
    const opts = UserMapper.toOptions(criteria);   
    return this.listByOptions(opts);           
    }

    async paginate(criteria: ListUsersCriteria): Promise<{ items: UserRead[]; total: number }> {
    const opts = UserMapper.toOptions(criteria);
    return this.paginateByOptions(opts);
    }

    async existsBy(filters: UserFilters): Promise<boolean> {
    const where = UserMapper.toWhereFromFilters(filters);
    return this.exists(where);
  }
  
  static withTx(model: ModelStatic<User>, tx: Transaction) {
  return new UserRepository(model, tx);
  }
}
