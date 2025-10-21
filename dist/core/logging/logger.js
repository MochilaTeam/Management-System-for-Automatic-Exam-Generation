"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const timeStampFormat_1 = __importDefault(require("./helpers/timeStampFormat"));
const { combine, timestamp, printf, errors, json } = winston_1.default.format;
class SystemLogger {
    constructor() {
        this.httpLogger = this.get_http_logger();
        this.debugLogger = this.get_debug_logger();
        this.errorLogger = this.get_error_logger();
        this.auditLogger = this.get_audit_logger();
    }
    get_audit_logger() {
        return winston_1.default.createLogger({
            format: combine(timestamp({ format: timeStampFormat_1.default }), json()),
            transports: [
                new winston_daily_rotate_file_1.default({
                    filename: 'logs/audit/-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '7d',
                }),
            ],
        });
    }
    get_error_logger() {
        return winston_1.default.createLogger({
            level: 'error',
            format: combine(timestamp({ format: timeStampFormat_1.default }), errors({ stack: true }), // include stacktrace
            winston_1.default.format.prettyPrint()),
            transports: [
                new winston_1.default.transports.Console({
                    format: combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
                }),
                new winston_daily_rotate_file_1.default({
                    filename: 'logs/errors/%DATE%.log',
                    datePattern: 'MMMM-DD-YYYY',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '7d',
                }),
            ],
        });
    }
    get_debug_logger() {
        return winston_1.default.createLogger({
            format: combine(timestamp({ format: timeStampFormat_1.default }), json()),
            transports: [
                new winston_daily_rotate_file_1.default({
                    filename: 'logs/audit/-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '7d',
                }),
            ],
        });
    }
    get_http_logger() {
        return winston_1.default.createLogger({
            format: combine(timestamp({ format: timeStampFormat_1.default }), json(), printf(({ level, message, ...data }) => {
                const response = {
                    level,
                    message,
                    data,
                };
                return JSON.stringify(response, null, 4);
            })),
            transports: [
                new winston_1.default.transports.Console(),
                new winston_daily_rotate_file_1.default({
                    filename: 'logs/http/%DATE%.log',
                    datePattern: 'MMMM-DD-YYYY',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '7d',
                }),
            ],
        });
    }
}
exports.SystemLogger = SystemLogger;
