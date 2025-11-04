import { Router } from 'express';

import { withValidatedBody } from '../../../../core/middlewares/requestValidator';
import { loginBodySchema } from '../../schemas/loginSchemas';
import { login } from '../controllers/loginControllers';

const loginRouter = Router();

loginRouter.post('/login', withValidatedBody(loginBodySchema, login));
export { loginRouter };
