import { Router } from 'express';

import { withValidatedBody } from '../../../../core/middlewares/requestValidator';
import { loginBodySchema } from '../../schemas/login';
import { login } from '../controllers/loginController';

const loginRouter = Router();

/**
 * @openapi
 * /login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Iniciar sesión
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Credenciales válidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciales inválidas
 */
loginRouter.post('/login', withValidatedBody(loginBodySchema, login));
export { loginRouter };
