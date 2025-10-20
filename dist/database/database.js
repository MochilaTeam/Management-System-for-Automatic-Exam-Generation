"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnect = exports.connect = exports.sequelize = exports.createDatabaseIfNotExists = exports.mysqlConfig = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const sequelize_1 = require("sequelize");
require("dotenv/config");
const dependencies_1 = require("../core/dependencies/dependencies");
const databaseName = process.env.DB_NAME;
const logger = dependencies_1.get_logger();
exports.mysqlConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
};
const PORT = exports.mysqlConfig.port;
logger.auditLogger.info('🔧 DB Config:', { PORT });
// Espera a que MySQL acepte conexiones (reintentos)
async function waitForDb(maxRetries = 30, delayMs = 1000) {
    for (let i = 1; i <= maxRetries; i++) {
        try {
            const conn = await promise_1.default.createConnection({
                host: exports.mysqlConfig.host,
                user: exports.mysqlConfig.user,
                password: exports.mysqlConfig.password,
                port: exports.mysqlConfig.port,
            });
            await conn.end();
            return;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.auditLogger.info(`DB no lista aún (intento ${i}/${maxRetries}): ${msg}`);
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
    throw new Error('MySQL no respondió a tiempo');
}
exports.createDatabaseIfNotExists = async () => {
    const connection = await promise_1.default.createConnection(exports.mysqlConfig);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;`);
    logger.auditLogger.info(`Database "${databaseName}" verified/created.`);
    await connection.end();
};
exports.sequelize = new sequelize_1.Sequelize(databaseName, exports.mysqlConfig.user, exports.mysqlConfig.password, {
    host: exports.mysqlConfig.host,
    port: exports.mysqlConfig.port,
    dialect: 'mysql',
    logging: false,
});
exports.connect = async () => {
    try {
        await waitForDb();
        await exports.createDatabaseIfNotExists();
        await exports.sequelize.authenticate();
        logger.auditLogger.info('Connected to MySQL');
        await exports.sequelize.sync({ alter: false });
    }
    catch (error) {
        logger.errorLogger.error('Error connecting to MySQL:', error);
        throw new Error('Failed to connect to the MySQL database');
    }
};
exports.disconnect = async () => {
    try {
        await exports.sequelize.close();
        logger.auditLogger.info('Disconnected from MySQL');
    }
    catch (error) {
        logger.errorLogger.error('Error disconnecting from MySQL:', error);
    }
};
