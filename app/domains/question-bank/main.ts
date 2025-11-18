import { Router } from 'express';

import questionTypeRoutes from './api/routes/questionTypeRoutes';
import subjectRoutes from './api/routes/subjectRoutes';
import subtopicRoutes from './api/routes/subtopicRoutes';
import topicRoutes from './api/routes/topicRoutes';
import questionRoutes from './api/routes/questionRoutes';
import { authenticate } from '../../core/middlewares/authenticate';

const questionBankRouter = Router();

// Si tienes endpoints públicos aquí, móntalos ANTES del authenticate.

// Endpoints protegidos
questionBankRouter.use(authenticate);
questionBankRouter.use(subjectRoutes);
questionBankRouter.use(subtopicRoutes);
questionBankRouter.use(topicRoutes);
questionBankRouter.use(questionTypeRoutes);
questionBankRouter.use(questionRoutes);
// TODO: cuando agregues más rutas del dominio:
// import topicRoutes from "./api/routes/topicRoutes";
// import subtopicRoutes from "./api/routes/subtopicRoutes";
// questionBankRouter.use(topicRoutes);
// questionBankRouter.use(subtopicRoutes);

export { questionBankRouter };
