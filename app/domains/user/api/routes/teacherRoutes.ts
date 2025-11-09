import { Router } from "express";
import { createTeacher, deleteTeacher, getTeacherById, listTeachers, updateTeacher } from "../controllers/teacherController";

const router = Router();

/**
 * @openapi
 * /teacher:
 *   get:
 *     tags:
 *       - Teachers
 *     summary: Listar docentes
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *         description: Coincidencia parcial contra el nombre.
 *       - in: query
 *         name: subjectLeader
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: examiner
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Colección paginada de docentes.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListTeachersResponse'
 *   post:
 *     tags:
 *       - Teachers
 *     summary: Crear un docente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeacherInput'
 *     responses:
 *       201:
 *         description: Docente creado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Teacher'
 */
router.get("/teacher", listTeachers);
router.post("/teacher", createTeacher);

/**
 * @openapi
 * /teacher/{teacherId}:
 *   get:
 *     tags:
 *       - Teachers
 *     summary: Obtener un docente por id
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Docente encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Teacher'
 *   patch:
 *     tags:
 *       - Teachers
 *     summary: Actualizar parcialmente un docente
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTeacherInput'
 *     responses:
 *       200:
 *         description: Docente actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Teacher'
 *   delete:
 *     tags:
 *       - Teachers
 *     summary: Desactivar un docente
 *     description: Marca al docente y a su usuario como inactivos para mantener el historial de profesores.
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Desactivado correctamente (sin contenido).
 */
router.get("/teacher/:teacherId", getTeacherById);
router.patch("/teacher/:teacherId", updateTeacher);
router.delete("/teacher/:teacherId", deleteTeacher);

export default router;
