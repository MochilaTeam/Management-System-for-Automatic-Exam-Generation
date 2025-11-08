import { Router } from "express";
import { createStudent, deleteStudent, getStudentById, listStudent, updateStudent } from "../controllers/studentController";
const router = Router();

router.get("/student",listStudent);
router.get("/student/:studentId", getStudentById);
router.post("/student", createStudent);
router.patch("/student/:studentId", updateStudent);
router.delete("/student/:studentId", deleteStudent);

export default router;
