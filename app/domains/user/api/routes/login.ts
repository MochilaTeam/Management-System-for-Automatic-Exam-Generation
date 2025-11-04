import { Router } from 'express';

import { withValidatedBody } from '../../../../core/middlewares/requestValidator';
import { loginBodySchema } from '../../schemas/login';
import { login } from '../controllers/login';

const loginRouter = Router();

loginRouter.post('/login', withValidatedBody(loginBodySchema, login));
export { loginRouter };
