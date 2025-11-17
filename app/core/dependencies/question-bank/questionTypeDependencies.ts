// src/core/dependencies/question-bank/questionTypeDependencies.ts

import { CreateQuestionTypeCommand } from '../../../domains/question-bank/application/commands/CreateQuestionTypeCommand';
import { DeleteQuestionTypeCommand } from '../../../domains/question-bank/application/commands/DeleteQuestionTypeCommand';
import { UpdateQuestionTypeCommand } from '../../../domains/question-bank/application/commands/UpdateQuestionTypeCommand';
import { GetQuestionTypeByIdQuery } from '../../../domains/question-bank/application/queries/GetQuestionTypeByIdQuery';
import { ListQuestionTypesQuery } from '../../../domains/question-bank/application/queries/ListQuestionTypesQuery';
import { QuestionTypeService } from '../../../domains/question-bank/domain/services/questionTypeService';
import QuestionType from '../../../infrastructure/question-bank/models/QuestionType';
import { QuestionTypeRepository } from '../../../infrastructure/question-bank/repositories/QuestionTypeRepository';

let _repo: QuestionTypeRepository | null = null;
let _svc: QuestionTypeService | null = null;
let _qList: ListQuestionTypesQuery | null = null;
let _qGetById: GetQuestionTypeByIdQuery | null = null;
let _cCreate: CreateQuestionTypeCommand | null = null;
let _cUpdate: UpdateQuestionTypeCommand | null = null;
let _cDelete: DeleteQuestionTypeCommand | null = null;

// Repository
export function makeQuestionTypeRepository() {
    if (_repo) return _repo;
    _repo = new QuestionTypeRepository(QuestionType);
    return _repo;
}

// Service
export function makeQuestionTypeService() {
    if (_svc) return _svc;
    _svc = new QuestionTypeService({
        repo: makeQuestionTypeRepository(),
    });
    return _svc;
}

// Queries
export function makeListQuestionTypesQuery() {
    if (_qList) return _qList;
    _qList = new ListQuestionTypesQuery(makeQuestionTypeService());
    return _qList;
}

export function makeGetQuestionTypeByIdQuery() {
    if (_qGetById) return _qGetById;
    _qGetById = new GetQuestionTypeByIdQuery(makeQuestionTypeService());
    return _qGetById;
}

// Commands
export function makeCreateQuestionTypeCommand() {
    if (_cCreate) return _cCreate;
    _cCreate = new CreateQuestionTypeCommand(makeQuestionTypeService());
    return _cCreate;
}

export function makeUpdateQuestionTypeCommand() {
    if (_cUpdate) return _cUpdate;
    _cUpdate = new UpdateQuestionTypeCommand(makeQuestionTypeService());
    return _cUpdate;
}

export function makeDeleteQuestionTypeCommand() {
    if (_cDelete) return _cDelete;
    _cDelete = new DeleteQuestionTypeCommand(makeQuestionTypeService());
    return _cDelete;
}
