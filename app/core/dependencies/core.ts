import { get_logger } from '../logging/logger';
import { getHasher } from '../security/hasher';

let _hasher: ReturnType<typeof getHasher> | null = null;
export function getCore() {
  const logger = get_logger();
  const sequelize = getSequelize();
  const models = getModels();
  const hasher = (_hasher ??= getHasher());
  return { logger, sequelize, models, hasher };
}
