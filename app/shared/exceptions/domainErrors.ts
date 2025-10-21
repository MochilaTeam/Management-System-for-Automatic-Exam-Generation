import { AppError, AppErrorOptions } from './appError';
import { HttpStatus } from '../enums/httpStatusEnum';

export class ValidationError extends AppError {
    constructor(opts: Omit<AppErrorOptions, 'statusCode'> & { statusCode?: HttpStatus }) {
        super({ statusCode: HttpStatus.BAD_REQUEST, ...opts });
    }
}

//When client asks for something that not exists
//ex: Tries to get a question with an id that not appears in the Database
export class NotFoundError extends AppError {
    constructor(opts: Omit<AppErrorOptions, 'statusCode'> & { statusCode?: HttpStatus }) {
        super({ statusCode: HttpStatus.NOT_FOUND, ...opts });
    }
}

//When client expected a unique result but receive many
export class MultipleResultsFoundError extends AppError {
    constructor(opts: Omit<AppErrorOptions, 'statusCode'> & { statusCode?: HttpStatus }) {
        super({ statusCode: HttpStatus.CONFLICT, ...opts });
    }
}

//When actual state of the database conflicts with the operation
//Tipical use: Email already in use, User name already in use
export class ConflictError extends AppError {
    constructor(opts: Omit<AppErrorOptions, 'statusCode'> & { statusCode?: HttpStatus }) {
        super({ statusCode: HttpStatus.CONFLICT, ...opts });
    }
}

export class BusinessRuleError extends AppError {
    constructor(opts: Omit<AppErrorOptions, 'statusCode'> & { statusCode?: HttpStatus }) {
        super({ statusCode: HttpStatus.BAD_REQUEST, ...opts });
    }
}

export class BaseDatabaseError extends AppError {
    constructor(opts: Omit<AppErrorOptions, 'statusCode'> & { statusCode?: HttpStatus }) {
        super({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, ...opts });
    }
}

//When client dont have valid authentication (problem with token)
export class UnauthorizedError extends AppError {
    constructor(opts: Omit<AppErrorOptions, 'statusCode'> & { statusCode?: HttpStatus }) {
        super({ statusCode: HttpStatus.UNAUTHORIZED, ...opts });
    }
}

//When client doesn't have permission for that operation
export class ForbiddenError extends AppError {
    constructor(opts: Omit<AppErrorOptions, 'statusCode'> & { statusCode?: HttpStatus }) {
        super({ statusCode: HttpStatus.FORBIDDEN, ...opts });
    }
}

//Failed communication with external services, not database
export class CommunicationError extends AppError {
    constructor(opts: Omit<AppErrorOptions, 'statusCode'> & { statusCode?: HttpStatus }) {
        super({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, ...opts });
    }
}
