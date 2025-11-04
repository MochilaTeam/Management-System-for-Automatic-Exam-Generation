import { UserEntity } from "../../../domains/user/domain/ports/IUserRepository";
import { UserRead } from "../../../domains/user/schemas/userSchema";
import { BaseMapper } from "../../../shared/domain/base_mapper";
import User from "../models/User";

export const UserMapper: BaseMapper<User, UserRead> = {
  toRead(row: User): UserRead {
    return {
      id: row.getDataValue("id"),
      name: row.getDataValue("name"),
      email: row.getDataValue("email"),
      role: row.getDataValue("role"),
      active: row.getDataValue("active"),
    };
  },
};