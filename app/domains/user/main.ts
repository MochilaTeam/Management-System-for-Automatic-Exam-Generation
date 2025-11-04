import { Router } from 'express';

import { loginRouter } from './api/routes/login';

const userRouter = Router();
userRouter.use('/user', loginRouter);
export { userRouter };
