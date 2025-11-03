import { SystemLogger } from '../logging/logger';

let cached_logger: SystemLogger | null = null;

export function get_logger(): SystemLogger {
    if (!cached_logger) {
        cached_logger = new SystemLogger();
    }
    return cached_logger;
}
