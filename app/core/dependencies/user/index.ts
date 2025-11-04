// domains/user/application/dependencies.ts
import type { SystemLogger } from "../../../core/logging/logger";
import type { SequelizeModels } from "../../../infrastructure/_shared/BaseSequelizeRepository";
import { UserRepositorySequelize } from "../../../infrastructure/user/repositories/UserRepositorySequelize";
import { UserService } from "../../user/domain/services/UserService";
import { ListUsersQuery } from "../../user/application/queries/ListUsers/ListUsersQuery";
import { GetUserByIdQuery } from "../../user/application/queries/GetUserById/GetUserByIdQuery";
import { CreateUserCommand } from "../../user/application/commands/CreateUser/CreateUserCommand";
import { UpdateUserCommand } from "../../user/application/commands/UpdateUser/UpdateUserCommand";
import { DeleteUserCommand } from "../../user/application/commands/DeleteUser/DeleteUserCommand";

// ---- caches (singletons) ----
let _repo: UserRepositorySequelize | null = null;
let _svc: UserService | null = null;
let _listUsers: ListUsersQuery | null = null;
let _getUserById: GetUserByIdQuery | null = null;
let _createUser: CreateUserCommand | null = null;
let _updateUser: UpdateUserCommand | null = null;
let _deleteUser: DeleteUserCommand | null = null;

type Core = { logger: SystemLogger; models: SequelizeModels; hasher?: { hash: (p: string) => Promise<string> } };

// Repository
export function makeUserRepository(core: Core) {
  return _repo ??= new UserRepositorySequelize({ models: core.models as any, logger: core.logger });
}

// Service
export function makeUserService(core: Core) {
  return _svc ??= new UserService({ repo: makeUserRepository(core), logger: core.logger, hasher: core.hasher });
}

// Queries
export function makeListUsersQuery(core: Core) {
  return _listUsers ??= new ListUsersQuery(makeUserRepository(core));
}
export function makeGetUserByIdQuery(core: Core) {
  return _getUserById ??= new GetUserByIdQuery(makeUserRepository(core));
}

// Commands
export function makeCreateUserCommand(core: Core) {
  return _createUser ??= new CreateUserCommand(makeUserRepository(core), makeUserService(core));
}
export function makeUpdateUserCommand(core: Core) {
  return _updateUser ??= new UpdateUserCommand(makeUserRepository(core));
}
export function makeDeleteUserCommand(core: Core) {
  return _deleteUser ??= new DeleteUserCommand(makeUserRepository(core));
}
