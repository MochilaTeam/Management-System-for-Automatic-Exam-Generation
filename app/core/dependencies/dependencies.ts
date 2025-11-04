import { sequelize } from '../../database/database';
import { getModels } from '../../database/models';
import { SystemLogger } from '../logging/logger';
import { getHasher } from '../security/hasher';

export type Hasher = ReturnType<typeof getHasher>;
export type Core = {
  models: ReturnType<typeof getModels>; 
  hasher: Hasher;
  sequelize: typeof sequelize;
};

let _logger: SystemLogger | null = null;
let _hasher: Hasher | null = null;

export function get_logger(): SystemLogger {
  return (_logger ??= new SystemLogger());
}

export function getCore(): Core {
  const models = getModels();           
  const hasher = (_hasher ??= getHasher());
  return { models, hasher, sequelize };
}
