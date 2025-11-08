import { Router } from "express";
import { createTeacher, deleteTeacher, getTeacherById, listTeachers, updateTeacher } from "../controllers/teacherController";
const router = Router();

router.get("/teacher",listTeachers);
router.get("/teacher/:teacherId", getTeacherById);
router.post("/teacher", createTeacher);
router.patch("/teacher/:teacherId", updateTeacher);
router.delete("/teacher/:teacherId", deleteTeacher);

export default router;
