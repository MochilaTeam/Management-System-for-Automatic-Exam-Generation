import { Router } from "express";

import { authenticate } from "../../core/middlewares/authenticate";
import { loginRouter } from "./api/routes/loginRoutes";
import studentRoutes from "./api/routes/studentRoutes";
import teacherRoutes from "./api/routes/teacherRoutes";
import userRoutes from "./api/routes/userRoutes";

const userRouter = Router();

// Public auth endpoints
userRouter.use(loginRouter);

// Protected endpoints
userRouter.use(authenticate);
userRouter.use(studentRoutes);
userRouter.use(teacherRoutes);
userRouter.use(userRoutes);

export { userRouter };
