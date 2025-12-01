import { Router } from 'express';

import examAssignmentRoutes from './api/routes/examAssignmentRoutes';
import examRegradeRoutes from './api/routes/examRegradeRoutes';
import examResponseRoutes from './api/routes/examResponseRoutes';

const examApplicationRouter = Router();

examApplicationRouter.use(examAssignmentRoutes);
examApplicationRouter.use(examResponseRoutes);
examApplicationRouter.use(examRegradeRoutes);

export { examApplicationRouter };
