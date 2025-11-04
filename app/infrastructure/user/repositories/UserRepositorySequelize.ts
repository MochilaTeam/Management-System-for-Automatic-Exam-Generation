import { ModelStatic } from "sequelize";
import { IUserRepository } from "../../../domains/user/domain/ports/IUserRepository";
import { UserRead } from "../../../domains/user/schemas/userSchema";
import { BaseRepository } from "../../../shared/domain/base_repository";
import User from "../models/User";
import { UserMapper } from "../mappers/userMapper";

export class UserRepositorySequelize
    extends BaseRepository<User, UserRead>
    implements IUserRepository
{

    constructor(model: ModelStatic<User>, mapper: UserMapper) {
        super(model,mapper);
    }
}
