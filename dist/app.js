"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("../domains/user/models");
const dependencies_1 = require("./core/dependencies/dependencies");
const errorHandler_1 = require("./core/middlewares/errorHandler");
const responseInterceptor_1 = require("./core/middlewares/responseInterceptor");
const database_1 = require("./database/database");
const database_2 = require("./database/database");
const init_1 = require("./database/init");
const PORT = 5000;
const logger = dependencies_1.get_logger();
const app = express_1.default();
app.use(express_1.default.json());
app.use(responseInterceptor_1.responseInterceptor);
const start = async () => {
    await database_1.createDatabaseIfNotExists();
    await database_2.connect();
    await init_1.syncTables();
    app.use(errorHandler_1.errorHandler);
    app.listen(PORT, () => {
        logger.debugLogger.debug(`Server On Port ${PORT}`);
    });
};
start().catch((err) => {
    logger.errorLogger.error('Fallo al iniciar la app', err);
    process.exit(1);
});
app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});
