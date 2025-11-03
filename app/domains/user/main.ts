import { Router } from 'express';

import { loginRouter } from './api/routes/loginRouter';

const userRouter = Router();
userRouter.use('/user', loginRouter);
export { userRouter };
