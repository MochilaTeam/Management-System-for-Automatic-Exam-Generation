import type { Transaction } from 'sequelize';

import { sequelize } from '../../../database/database';
import {
    CreateTeacherCommand,
    TeacherModuleServices,
} from '../../../domains/user/application/commands/createTeacherCommand';
import { DeleteTeacherCommand } from '../../../domains/user/application/commands/deleteTeacherCommand';
import { UpdateTeacherCommand } from '../../../domains/user/application/commands/updateTeacherCommand';
import { GetTeacherByIdQuery } from '../../../domains/user/application/queries/GetTeacherByIdQuery';
import { ListTeachersQuery } from '../../../domains/user/application/queries/ListTeachersQuery';
import { TeacherService } from '../../../domains/user/domain/services/teacherService';
import { UserService } from '../../../domains/user/domain/services/userService';
import { Teacher, User } from '../../../infrastructure/user/models';
import { TeacherRepository } from '../../../infrastructure/user/repositories/TeacherRepository';
import { UserRepository } from '../../../infrastructure/user/repositories/UserRepository';
import { IUnitOfWork } from '../../../shared/UoW/IUnitOfWork';
import { SequelizeUnitOfWork } from '../../../shared/UoW/SequelizeUnitOfWork';

let _uow: IUnitOfWork<TeacherModuleServices> | null = null;
let _teacherService: TeacherService | null = null;
let _cCreate: CreateTeacherCommand | null = null;
let _cUpdate: UpdateTeacherCommand | null = null;
let _cDelete: DeleteTeacherCommand | null = null;
let _qList: ListTeachersQuery | null = null;
let _qGet: GetTeacherByIdQuery | null = null;

function makeTeacherService(): TeacherService {
    if (_teacherService) return _teacherService;
    _teacherService = new TeacherService({
        teacherRepo: new TeacherRepository(Teacher),
        userRepo: new UserRepository(User),
    });
    return _teacherService;
}

export function makeTeacherUoW(): IUnitOfWork<TeacherModuleServices> {
    if (_uow) return _uow;

    _uow = new SequelizeUnitOfWork<TeacherModuleServices>(sequelize, (tx: Transaction) => {
        const users = new UserService({ repo: UserRepository.withTx(User, tx) });
        const teachers = new TeacherService({
            teacherRepo: TeacherRepository.withTx(Teacher, tx),
            userRepo: UserRepository.withTx(User, tx),
        });
        return { users, teachers };
    });

    return _uow;
}

export function makeCreateTeacherCommand() {
    if (_cCreate) return _cCreate;
    _cCreate = new CreateTeacherCommand(makeTeacherUoW());
    return _cCreate;
}

export function makeUpdateTeacherCommand() {
    if (_cUpdate) return _cUpdate;
    _cUpdate = new UpdateTeacherCommand(makeTeacherUoW());
    return _cUpdate;
}

export function makeDeleteTeacherCommand() {
    if (_cDelete) return _cDelete;
    _cDelete = new DeleteTeacherCommand(makeTeacherUoW());
    return _cDelete;
}

export function makeListTeachersQuery() {
    if (_qList) return _qList;
    _qList = new ListTeachersQuery(makeTeacherService());
    return _qList;
}

export function makeGetTeacherByIdQuery() {
    if (_qGet) return _qGet;
    _qGet = new GetTeacherByIdQuery(makeTeacherService());
    return _qGet;
}
