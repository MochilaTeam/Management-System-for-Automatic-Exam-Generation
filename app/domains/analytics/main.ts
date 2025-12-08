import { Router } from 'express';

import analyticsRoutes from './api/routes/analyticsRoutes';

const analyticsRouter = Router();
analyticsRouter.use(analyticsRoutes);

export { analyticsRouter };
