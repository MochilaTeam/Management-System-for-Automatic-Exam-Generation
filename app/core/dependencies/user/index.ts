import { getUserModels } from "../../../database/models";
import { CreateUserCommand } from "../../../domains/user/application/commands/createUser";
import { DeleteUserCommand } from "../../../domains/user/application/commands/deleteUser";
import { UpdateUserCommand } from "../../../domains/user/application/commands/updateUser";
import { GetUserByIdQuery } from "../../../domains/user/application/queries/GetUserByIdQuery";
import { ListUsersQuery } from "../../../domains/user/application/queries/ListUserQuery";
import { UserService } from "../../../domains/user/domain/services/userService";
import User from "../../../infrastructure/user/models/User";
import { UserRepositorySequelize } from "../../../infrastructure/user/repositories/UserRepository";

let _repo: UserRepositorySequelize | null = null;
let _svc: UserService | null = null;
let _qList: ListUsersQuery | null = null;
let _qGetById: GetUserByIdQuery | null = null;
let _cCreate: CreateUserCommand | null = null;
let _cUpdate: UpdateUserCommand | null = null;
let _cDelete: DeleteUserCommand | null = null;

//Repository
export function makeUserRepository() {
  if (_repo) return _repo;
  _repo = new UserRepositorySequelize(User);
  return _repo;
}

//Service
export function makeUserService() {
  if (_svc) return _svc;
  _svc = new UserService({
    repo: makeUserRepository(),
  });
  return _svc;
} 

//Queries
export function makeListUsersQuery() {
  if (_qList) return _qList;
  _qList = new ListUsersQuery(makeUserService());
  return _qList;
}

export function makeGetUserByIdQuery() {
  if (_qGetById) return _qGetById;
  _qGetById = new GetUserByIdQuery(makeUserService());
  return _qGetById;
}

//Commands
export function makeCreateUserCommand(core: Core = getCore()) {
  if (_cCreate) return _cCreate;
  // Create suele necesitar reglas (hash, validaciones), por eso inyectamos el service
  _cCreate = new CreateUserCommand(makeUserRepository(core), makeUserService(core));
  return _cCreate;
}

export function makeUpdateUserCommand(core: Core = getCore()) {
  if (_cUpdate) return _cUpdate;
  // Si Update tiene reglas (normalización, hash condicional), usa el service:
  // _cUpdate = new UpdateUserCommand(makeUserService(core));
  // Si es patch simple, repo basta:
  _cUpdate = new UpdateUserCommand(makeUserRepository(core));
  return _cUpdate;
}

export function makeDeleteUserCommand(core: Core = getCore()) {
  if (_cDelete) return _cDelete;
  _cDelete = new DeleteUserCommand(makeUserRepository(core));
  return _cDelete;
}
