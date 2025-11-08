import { sequelize } from "../../../database/database";
import { CreateStudentCommand, StudentModuleServices } from "../../../domains/user/application/commands/createStudentCommand";
import { StudentService } from "../../../domains/user/domain/services/studentService";
import { UserService } from "../../../domains/user/domain/services/userService";
import { StudentRepository } from "../../../infrastructure/user/repositories/StudentRepository";
import { UserRepository } from "../../../infrastructure/user/repositories/UserRepository";
import Student from "../../../infrastructure/user/models/Student";
import User from "../../../infrastructure/user/models/User";
import type { Transaction } from "sequelize";
import { IUnitOfWork } from "../../../shared/UoW/IUnitOfWork";
import { SequelizeUnitOfWork } from "../../../shared/UoW/SequelizeUnitOfWork";

let _uow: IUnitOfWork<StudentModuleServices> | null = null;
let _cCreate: CreateStudentCommand | null = null;

export function makeStudentUoW(): IUnitOfWork<StudentModuleServices> {
  if (_uow) return _uow;

  _uow = new SequelizeUnitOfWork<StudentModuleServices>(
    sequelize,
    (tx: Transaction) => {
      const users = new UserService({ repo: UserRepository.withTx(User, tx) });
      const students = new StudentService({
        studentRepo: StudentRepository.withTx(Student, tx),
        userRepo: UserRepository.withTx(User, tx),
      });
      return { users, students };
    }
  );

  return _uow;
}

export function makeCreateStudentCommand() {
  if (_cCreate) return _cCreate;
  _cCreate = new CreateStudentCommand(makeStudentUoW());
  return _cCreate;
}
