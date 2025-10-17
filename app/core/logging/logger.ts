import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import timestampFormat from './helpers/timeStampFormat';

const { combine, timestamp, printf, errors, json } = winston.format;

export class SystemLogger {
  readonly httpLogger: winston.Logger;
  readonly debugLogger: winston.Logger;
  readonly errorLogger: winston.Logger;
  readonly auditLogger: winston.Logger;

  constructor() {
    this.httpLogger = this.get_http_logger();
    this.debugLogger = this.get_debug_logger();
    this.errorLogger = this.get_error_logger();
    this.auditLogger = this.get_audit_logger();
  }

  get_audit_logger(): winston.Logger {
    return winston.createLogger({
      format: combine(timestamp({ format: timestampFormat }), json()),
      transports: [
        new DailyRotateFile({
          filename: 'logs/audit/-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '7d',
        }),
      ],
    });
  }

  get_error_logger(): winston.Logger {
    return winston.createLogger({
      level: 'error',
      format: combine(
        timestamp({ format: timestampFormat }),
        errors({ stack: true }), // include stacktrace
        winston.format.prettyPrint(),
      ),
      transports: [
        new winston.transports.Console({
          format: combine(winston.format.colorize(), winston.format.simple()),
        }),
        new DailyRotateFile({
          filename: 'logs/errors/%DATE%.log',
          datePattern: 'MMMM-DD-YYYY',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '7d',
        }),
      ],
    });
  }

  get_debug_logger(): winston.Logger {
    return winston.createLogger({
      format: combine(timestamp({ format: timestampFormat }), json()),
      transports: [
        new DailyRotateFile({
          filename: 'logs/audit/-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '7d',
        }),
      ],
    });
  }

  get_http_logger(): winston.Logger {
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
      transports: [
        new winston.transports.Console(),
        new DailyRotateFile({
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
