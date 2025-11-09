import express, { Request, Response } from 'express';

import { get_logger } from './core/dependencies/dependencies';
import { SystemLogger } from './core/logging/logger';
import { errorHandler } from './core/middlewares/errorHandler';
import { responseInterceptor } from './core/middlewares/responseInterceptor';
import { createDatabaseIfNotExists } from './database/database';
import { connect } from './database/database';
import { syncTables } from './database/init';
import { userRouter } from './domains/user/main';
import router from './domains/user/api/routes/studentRoutes';

const PORT = 5000;
const logger: SystemLogger = get_logger();

const app = express();
app.use(express.json());
app.use(responseInterceptor);
app.use(router)
//app.use(userRouter);

const start = async () => {
    await createDatabaseIfNotExists();
    await connect();
    await syncTables();

    app.use(errorHandler);
    app.listen(PORT, () => {
        logger.debugLogger.debug(`Server On Port ${PORT}`);
    });
};

start().catch((err) => {
    logger.errorLogger.error('Fallo al iniciar la app', err);
    process.exit(1);
});

app.get('/ping', (_req: Request, res: Response) => {
    res.json({ message: 'pong' });
});
