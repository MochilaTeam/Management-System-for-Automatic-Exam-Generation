import { Router } from 'express';

import examRoutes from './api/routes/examRoutes';
import { authenticate } from '../../core/middlewares/authenticate';

const examApplicationRouter = Router();

// Endpoints protegidos
examApplicationRouter.use(authenticate);
examApplicationRouter.use(examRoutes);

export { examApplicationRouter };
