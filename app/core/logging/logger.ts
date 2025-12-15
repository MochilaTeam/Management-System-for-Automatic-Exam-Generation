import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import timestampFormat from './helpers/timeStampFormat';

const { combine, timestamp, printf, errors, json } = winston.format;

export class SystemLogger {
    readonly httpLogger: winston.Logger;
    readonly debugLogger: winston.Logger;
    readonly errorLogger: winston.Logger;
    readonly auditLogger: winston.Logger;
    private readonly isTestEnv: boolean;

    constructor() {
        this.isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
        this.httpLogger = this.get_http_logger();
        this.debugLogger = this.get_debug_logger();
        this.errorLogger = this.get_error_logger();
        this.auditLogger = this.get_audit_logger();
    }

    private createSilentTransport(): winston.transport {
        return new winston.transports.Console({ silent: true });
    }

    get_audit_logger(): winston.Logger {
        const transports: winston.transport[] = this.isTestEnv
            ? [this.createSilentTransport()]
            : [
                  new DailyRotateFile({
                      filename: 'logs/audit/-%DATE%.log',
                      datePattern: 'YYYY-MM-DD',
                      maxSize: '20m',
                      maxFiles: '7d',
                  }),
              ];
        return winston.createLogger({
            format: combine(timestamp({ format: timestampFormat }), json()),
            transports,
        });
    }

    get_error_logger(): winston.Logger {
        const transports: winston.transport[] = [
            new winston.transports.Console({
                format: combine(winston.format.colorize(), winston.format.simple()),
                silent: this.isTestEnv,
            }),
        ];
        if (!this.isTestEnv) {
            transports.push(
                new DailyRotateFile({
                    filename: 'logs/errors/%DATE%.log',
                    datePattern: 'MMMM-DD-YYYY',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '7d',
                }),
            );
        }
        return winston.createLogger({
            level: 'error',
            format: combine(
                timestamp({ format: timestampFormat }),
                errors({ stack: true }), // include stacktrace
                winston.format.prettyPrint(),
            ),
            transports,
        });
    }

    get_debug_logger(): winston.Logger {
        const transports: winston.transport[] = this.isTestEnv
            ? [this.createSilentTransport()]
            : [
                  new DailyRotateFile({
                      filename: 'logs/audit/-%DATE%.log',
                      datePattern: 'YYYY-MM-DD',
                      maxSize: '20m',
                      maxFiles: '7d',
                  }),
              ];
        return winston.createLogger({
            format: combine(timestamp({ format: timestampFormat }), json()),
            transports,
        });
    }

    get_http_logger(): winston.Logger {
        const transports: winston.transport[] = [new winston.transports.Console()];
        if (!this.isTestEnv) {
            transports.push(
                new DailyRotateFile({
                    filename: 'logs/http/%DATE%.log',
                    datePattern: 'MMMM-DD-YYYY',
                    zippedArchive: true,
                    maxSize: '20m',
                    maxFiles: '7d',
                }),
            );
        }
        return winston.createLogger({
            format: combine(
                timestamp({ format: timestampFormat }),
                json(),
                printf(({ level, message, ...data }) => {
                    const response = {
                        level,
                        message,
                        data,
                    };

                    return JSON.stringify(response, null, 4);
                }),
            ),
            transports,
        });
    }
}
