import { Router } from 'express';

// import { loginRouter } from './api/routes/loginRoutes';

const userRouter = Router();
userRouter.use('/user', /*loginRouter*/);
export { userRouter };
