// app/domains/question-bank/api/routes/subjectRoutes.ts
import { Router } from 'express';

import {
    createSubject,
    deleteSubject,
    getSubjectById,
    listSubjects,
    updateSubject,
} from '../controllers/subjectController';

const router = Router();

/**
 * @openapi
 * /subjects:
 *   get:
 *     tags: [Subjects]
 *     summary: Listar asignaturas (detalle)
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre o programa (like).
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtro exacto por nombre.
 *       - in: query
 *         name: program
 *         schema:
 *           type: string
 *         description: Filtro exacto por programa.
 *       - in: query
 *         name: leader_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtra por id del líder asignado.
 *       - in: query
 *         name: sort_field
 *         schema:
 *           type: string
 *           enum: [createdAt, name]
 *         description: Campo por el que ordenar.
 *       - in: query
 *         name: sort_dir
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Dirección del ordenamiento.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Colección paginada de SubjectDetail.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSubjectDetailResponse'
 *   post:
 *     tags: [Subjects]
 *     summary: Crear asignatura
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubjectInput'
 *     responses:
 *       201:
 *         description: Asignatura creada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
 *                 success:
 *                   type: boolean
 */
router.get('/subjects', listSubjects);
router.post('/subjects', createSubject);

/**
 * @openapi
 * /subjects/{subjectId}:
 *   get:
 *     tags: [Subjects]
 *     summary: Obtener asignatura por id (detalle)
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle de la asignatura.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RetrieveOneSubjectDetailResponse'
 *   patch:
 *     tags: [Subjects]
 *     summary: Actualizar asignatura
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSubjectInput'
 *     responses:
 *       200:
 *         description: Asignatura actualizada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Subject'
 *                 success:
 *                   type: boolean
 *   delete:
 *     tags: [Subjects]
 *     summary: Eliminar asignatura
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Eliminado correctamente.
 */
router.get('/subjects/:subjectId', getSubjectById);
router.patch('/subjects/:subjectId', updateSubject);
router.delete('/subjects/:subjectId', deleteSubject);

export default router;
