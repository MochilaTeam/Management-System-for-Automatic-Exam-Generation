import { Router } from 'express';

import { requireRoles } from '../../../../core/middlewares/authorize';
import { Roles } from '../../../../shared/enums/rolesEnum';
import {
    createQuestion,
    deleteQuestion,
    getQuestionById,
    listQuestions,
    updateQuestion,
} from '../controllers/questionController';

const router = Router();

/**
 * @openapi
 * /questions:
 *   get:
 *     tags: [Questions]
 *     summary: Listar preguntas
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por texto en el enunciado.
 *       - in: query
 *         name: subtopicId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [EASY, MEDIUM, HARD]
 *       - in: query
 *         name: questionTypeId
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Colección paginada de preguntas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *   post:
 *     tags: [Questions]
 *     summary: Crear una pregunta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQuestionInput'
 *     responses:
 *       201:
 *         description: Pregunta creada correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Question' }
 *                 success: { type: boolean }
 */
router.get('/questions', listQuestions);
router.post('/questions', createQuestion);

/**
 * @openapi
 * /questions/{questionId}:
 *   get:
 *     tags: [Questions]
 *     summary: Obtener una pregunta por id
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pregunta encontrada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Question' }
 *                 success: { type: boolean }
 *   patch:
 *     tags: [Questions]
 *     summary: Actualizar una pregunta
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQuestionInput'
 *     responses:
 *       200:
 *         description: Pregunta actualizada (nueva versión o in-place).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/Question' }
 *                 success: { type: boolean }
 *   delete:
 *     tags: [Questions]
 *     summary: Eliminar una pregunta (hard o soft delete según uso en exámenes)
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Eliminada correctamente.
 */
router.get('/questions/:questionId', requireRoles(Roles.TEACHER), getQuestionById);
router.patch('/questions/:questionId', updateQuestion);
router.delete('/questions/:questionId', deleteQuestion);

export default router;
