import { Router } from "express";
import {updateUser,deleteUser, getUserById, createUser,listUsers } from "../controllers/userController";

const router = Router();

router.get("/users",listUsers);
router.get("/users/:userId", getUserById);
router.post("/users", createUser);
router.patch("/users/:userId", updateUser);
router.delete("/users/:userId", deleteUser);

export default router;
