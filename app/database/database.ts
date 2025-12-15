import mysql from 'mysql2/promise';
import { Sequelize, DataTypes } from 'sequelize';
import type { QueryInterface } from 'sequelize';

import 'dotenv/config';
import { get_logger } from '../core/dependencies/dependencies';
import { SystemLogger } from '../core/logging/logger';

const databaseName = process.env.DB_NAME!;
const logger: SystemLogger = get_logger();

export const mysqlConfig = {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    port: parseInt(process.env.DB_PORT!),
};

const PORT = mysqlConfig.port;
logger.auditLogger.info('🔧 DB Config:', { PORT });

// Espera a que MySQL acepte conexiones (reintentos)
async function waitForDb(maxRetries = 30, delayMs = 1000) {
    for (let i = 1; i <= maxRetries; i++) {
        try {
            const conn = await mysql.createConnection({
                host: mysqlConfig.host,
                user: mysqlConfig.user,
                password: mysqlConfig.password,
                port: mysqlConfig.port,
            });
            await conn.end();
            return;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.auditLogger.info(`DB no lista aún (intento ${i}/${maxRetries}): ${msg}`);
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
    throw new Error('MySQL no respondió a tiempo');
}

export const createDatabaseIfNotExists = async (): Promise<void> => {
    const connection = await mysql.createConnection(mysqlConfig);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;`);
    logger.auditLogger.info(`Database "${databaseName}" verified/created.`);
    await connection.end();
};

export const sequelize = new Sequelize(databaseName, mysqlConfig.user, mysqlConfig.password, {
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    dialect: 'mysql',
    logging: false,
});

export const connect = async (): Promise<void> => {
    try {
        await waitForDb();
        await createDatabaseIfNotExists();
        await sequelize.authenticate();
        logger.auditLogger.info('Connected to MySQL');
        await ensureActiveIndexColumn();
        await sequelize.sync({ alter: false });
    } catch (error) {
        logger.errorLogger.error('Error connecting to MySQL:', error);
        throw new Error('Failed to connect to the MySQL database');
    }
};

async function ensureActiveIndexColumn(): Promise<void> {
    const queryInterface: QueryInterface = sequelize.getQueryInterface();
    try {
        const columns = await queryInterface.describeTable('Exams');
        if (!('active' in columns)) {
            await queryInterface.addColumn('Exams', 'active', {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("doesn't exist") || message.includes('ER_BAD_TABLE_ERROR')) {
            return;
        }
        throw error;
    }
}

export const disconnect = async (): Promise<void> => {
    try {
        await sequelize.close();
        logger.auditLogger.info('Disconnected from MySQL');
    } catch (error) {
        logger.errorLogger.error('Error disconnecting from MySQL:', error);
    }
};
