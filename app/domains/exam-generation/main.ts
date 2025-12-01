import { Router } from 'express';

import examRoutes from './api/routes/examRoutes';
import { authenticate } from '../../core/middlewares/authenticate';

const examGenerationRouter = Router();

examGenerationRouter.use(authenticate);
examGenerationRouter.use(examRoutes);

export { examGenerationRouter };
