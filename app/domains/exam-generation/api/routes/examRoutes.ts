import { Router } from 'express';

import {
    acceptExam,
    createAutomaticExam,
    createManualExam,
    deleteExam,
    getExamById,
    listExams,
    rejectExam,
    requestExamReview,
    updateExam,
} from '../controllers/examController';

const router = Router();

/**
 * @openapi
 * /exams:
 *   get:
 *     tags:
 *       - Exams
 *     summary: Listar exámenes parametrizados
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *       - in: query
 *         name: examStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
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
 *         description: Colección paginada de exámenes.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListExamsResponse'
 */
router.get('/exams', listExams);

/**
 * @openapi
 * /exams/manual:
 *   post:
 *     tags:
 *       - Exams
 *     summary: Crear un examen de forma manual
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateManualExamInput'
 *     responses:
 *       201:
 *         description: Examen creado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamDetailResponse'
 */
router.post('/exams/manual', createManualExam);

/**
 * @openapi
 * /exams/automatic:
 *   post:
 *     tags:
 *       - Exams
 *     summary: Generar una propuesta de examen automático a partir de una parametrización
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAutomaticExamInput'
 *     responses:
 *       200:
 *         description: Propuesta generada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AutomaticExamPreviewResponse'
 */
router.post('/exams/automatic', createAutomaticExam);

/**
 * @openapi
 * /exams/{examId}:
 *   get:
 *     tags:
 *       - Exams
 *     summary: Obtener examen por id
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Examen encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamDetailResponse'
 *   patch:
 *     tags:
 *       - Exams
 *     summary: Actualizar un examen
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateExamInput'
 *     responses:
 *       200:
 *         description: Examen actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamDetailResponse'
 *   delete:
 *     tags:
 *       - Exams
 *     summary: Eliminar un examen
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Eliminado correctamente.
 */
router.get('/exams/:examId', getExamById);
router.patch('/exams/:examId', updateExam);
router.delete('/exams/:examId', deleteExam);

/**
 * @openapi
 * /exams/{examId}/request-review:
 *   post:
 *     tags:
 *       - Exams
 *     summary: Solicitar revisión de un examen
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Estado actualizado a revisión.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamDetailResponse'
 */
router.post('/exams/:examId/request-review', requestExamReview);

/**
 * @openapi
 * /exams/{examId}/accept:
 *   post:
 *     tags:
 *       - Exams
 *     summary: Aceptar un examen en revisión
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Examen aceptado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamDetailResponse'
 */
router.post('/exams/:examId/accept', acceptExam);

/**
 * @openapi
 * /exams/{examId}/reject:
 *   post:
 *     tags:
 *       - Exams
 *     summary: Rechazar un examen en revisión
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Examen rechazado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamDetailResponse'
 */
router.post('/exams/:examId/reject', rejectExam);

export default router;
