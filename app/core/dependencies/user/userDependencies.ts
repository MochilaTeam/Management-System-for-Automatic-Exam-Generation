import { Transaction } from "sequelize";
import { GetUserByIdQuery } from "../../../domains/user/application/queries/GetUserByIdQuery";
import { ListUsersQuery } from "../../../domains/user/application/queries/ListUserQuery";
import { UserService } from "../../../domains/user/domain/services/userService";
import { User } from "../../../infrastructure/user/models";
import { UserRepository } from "../../../infrastructure/user/repositories/UserRepository";
import { CreateUserCommand } from "../../../domains/user/application/commands/createUser";
import { UpdateUserCommand } from "../../../domains/user/application/commands/updateUser";
import { DeleteUserCommand } from "../../../domains/user/application/commands/deleteUser";
import { LoginCommand } from "../../../domains/user/application/commands/loginCommand";

let _repo: UserRepository | null = null;
let _svc: UserService | null = null;
let _qList: ListUsersQuery | null = null;
let _qGetById: GetUserByIdQuery | null = null;
let _cCreate: CreateUserCommand | null = null;
let _cUpdate: UpdateUserCommand | null = null;
let _cDelete: DeleteUserCommand | null = null;
let _cLogin: LoginCommand | null = null;


//Repository
export function makeUserRepository() {
  if (_repo) return _repo;
  _repo = new UserRepository(User);
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
export function makeCreateUserCommand() {
  if (_cCreate) return _cCreate;
  _cCreate = new CreateUserCommand(makeUserService());
  return _cCreate;
}

export function makeUpdateUserCommand() {
  if (_cUpdate) return _cUpdate;
  _cUpdate = new UpdateUserCommand(makeUserService());
  return _cUpdate;
}

export function makeDeleteUserCommand() {
  if (_cDelete) return _cDelete;
  _cDelete = new DeleteUserCommand(makeUserService());
  return _cDelete;
}

export function makeLoginCommand() {
  if (_cLogin) return _cLogin;
  _cLogin = new LoginCommand(makeUserService());
  return _cLogin;
}
