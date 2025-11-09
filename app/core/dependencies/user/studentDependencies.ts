import type { Transaction } from 'sequelize';

import { sequelize } from '../../../database/database';
import {
    CreateStudentCommand,
    StudentModuleServices,
} from '../../../domains/user/application/commands/createStudentCommand';
import { DeleteStudentCommand } from '../../../domains/user/application/commands/deleteStudentCommand';
import { UpdateStudentCommand } from '../../../domains/user/application/commands/updateStudentCommand';
import { GetStudentByIdQuery } from '../../../domains/user/application/queries/GetStudentByIdQuery';
import { ListStudentsQuery } from '../../../domains/user/application/queries/ListStudentsQuery';
import { StudentService } from '../../../domains/user/domain/services/studentService';
import { UserService } from '../../../domains/user/domain/services/userService';
import { Student, User } from '../../../infrastructure/user/models';
import { StudentRepository } from '../../../infrastructure/user/repositories/StudentRepository';
import { UserRepository } from '../../../infrastructure/user/repositories/UserRepository';
import { IUnitOfWork } from '../../../shared/UoW/IUnitOfWork';
import { SequelizeUnitOfWork } from '../../../shared/UoW/SequelizeUnitOfWork';

let _uow: IUnitOfWork<StudentModuleServices> | null = null;
let _studentService: StudentService | null = null;
let _cCreate: CreateStudentCommand | null = null;
let _cUpdate: UpdateStudentCommand | null = null;
let _cDelete: DeleteStudentCommand | null = null;
let _qList: ListStudentsQuery | null = null;
let _qGet: GetStudentByIdQuery | null = null;

function makeStudentService(): StudentService {
    if (_studentService) return _studentService;
    _studentService = new StudentService({
        studentRepo: new StudentRepository(Student),
        userRepo: new UserRepository(User),
    });
    return _studentService;
}

export function makeStudentUoW(): IUnitOfWork<StudentModuleServices> {
    if (_uow) return _uow;

    _uow = new SequelizeUnitOfWork<StudentModuleServices>(sequelize, (tx: Transaction) => {
        const users = new UserService({ repo: UserRepository.withTx(User, tx) });
        const students = new StudentService({
            studentRepo: StudentRepository.withTx(Student, tx),
            userRepo: UserRepository.withTx(User, tx),
        });
        return { users, students };
    });

    return _uow;
}

export function makeCreateStudentCommand() {
    if (_cCreate) return _cCreate;
    _cCreate = new CreateStudentCommand(makeStudentUoW());
    return _cCreate;
}

export function makeUpdateStudentCommand() {
    if (_cUpdate) return _cUpdate;
    _cUpdate = new UpdateStudentCommand(makeStudentUoW());
    return _cUpdate;
}

export function makeDeleteStudentCommand() {
    if (_cDelete) return _cDelete;
    _cDelete = new DeleteStudentCommand(makeStudentUoW());
    return _cDelete;
}

export function makeListStudentsQuery() {
    if (_qList) return _qList;
    _qList = new ListStudentsQuery(makeStudentService());
    return _qList;
}

export function makeGetStudentByIdQuery() {
    if (_qGet) return _qGet;
    _qGet = new GetStudentByIdQuery(makeStudentService());
    return _qGet;
}
