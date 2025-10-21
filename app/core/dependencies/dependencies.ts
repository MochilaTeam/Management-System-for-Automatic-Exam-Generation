import { SystemLogger } from '../logging/logger';

export function get_logger(): SystemLogger {
    return new SystemLogger();
}
