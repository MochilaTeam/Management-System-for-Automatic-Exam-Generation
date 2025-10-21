import { HttpStatus } from '../enums/httpStatusEnum';

export interface AppErrorOptions {
    message: string;
    entity?: string | null;
    code?: string | null;
    statusCode?: HttpStatus;
}

export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly entity?: string | null;

    constructor({
        message,
        entity = null,
        code = null,
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    }: AppErrorOptions) {
        super(message);
        // Fix prototype chain for TS when extending Error
        Object.setPrototypeOf(this, new.target.prototype);

        this.name = this.constructor.name;
        this.code = code ?? this.name;
        this.statusCode = statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
        this.entity = entity ?? null;
    }

    toJSON() {
        return {
            message: this.message,
            code: this.code,
            statusCode: this.statusCode,
            entity: this.entity,
        };
    }
}
