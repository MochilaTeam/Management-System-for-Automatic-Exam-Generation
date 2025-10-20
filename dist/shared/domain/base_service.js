"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDomainService = void 0;
const domainErrors_1 = require("../exceptions/domainErrors");
class BaseDomainService {
    constructor(logger) {
        this.logger = logger;
        this.serviceName = this.constructor.name;
    }
    logOperationStart(operation) {
        this.logger.auditLogger.info(`STARTING: ${operation} | SERVICE: ${this.serviceName}`);
    }
    logOperationSuccess(operation) {
        this.logger.auditLogger.info(`COMPLETED: ${operation} | SERVICE: ${this.serviceName}`);
    }
    logOperationError(operation, error) {
        this.logger.errorLogger.error(`FAILED: ${operation} | SERVICE: ${this.serviceName} | ERROR: ${error.message}`, { stack: error.stack });
    }
    raiseBusinessRuleError(operation, message, opts) {
        const error = new domainErrors_1.BusinessRuleError({
            message,
            entity: opts?.entity ?? null,
            code: opts?.code ?? null,
        });
        this.logOperationError(operation, error);
        throw error;
    }
    raiseValidationError(operation, message, opts) {
        const error = new domainErrors_1.ValidationError({
            message,
            entity: opts?.entity ?? null,
            code: opts?.code ?? null,
        });
        this.logOperationError(operation, error);
        throw error;
    }
    raiseNotFoundError(operation, message, opts) {
        const error = new domainErrors_1.NotFoundError({
            message,
            entity: opts?.entity ?? null,
            code: opts?.code ?? null,
        });
        this.logOperationError(operation, error);
        throw error;
    }
}
exports.BaseDomainService = BaseDomainService;
