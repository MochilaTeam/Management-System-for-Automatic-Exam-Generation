import { Router } from 'express';

import {
    createStudent,
    deleteStudent,
    getStudentById,
    listStudent,
    updateStudent,
} from '../controllers/studentController';

const router = Router();

/**
 * @openapi
 * /student:
 *   get:
 *     tags:
 *       - Students
 *     summary: Listar estudiantes
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filtra por rol del usuario asociado.
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
 *         description: Colección paginada de estudiantes.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListStudentsResponse'
 *   post:
 *     tags:
 *       - Students
 *     summary: Crear un estudiante
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStudentInput'
 *     responses:
 *       201:
 *         description: Estudiante creado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 */
router.get('/student', listStudent);
router.post('/student', createStudent);

/**
 * @openapi
 * /student/{studentId}:
 *   get:
 *     tags:
 *       - Students
 *     summary: Obtener un estudiante por id
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Estudiante encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *   patch:
 *     tags:
 *       - Students
 *     summary: Actualizar parcialmente un estudiante
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStudentInput'
 *     responses:
 *       200:
 *         description: Estudiante actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *   delete:
 *     tags:
 *       - Students
 *     summary: Desactivar un estudiante
 *     description: Marca al estudiante y a su usuario como inactivos para conservar el historial.
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Desactivado correctamente (sin contenido).
 */
router.get('/student/:studentId', getStudentById);
router.patch('/student/:studentId', updateStudent);
router.delete('/student/:studentId', deleteStudent);

export default router;
