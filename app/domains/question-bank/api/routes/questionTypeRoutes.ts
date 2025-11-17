// src/interfaces/http/routes/questionTypeRoutes.ts
import { Router } from 'express';

import {
    createQuestionType,
    deleteQuestionType,
    getQuestionTypeById,
    listQuestionTypes,
    updateQuestionType,
} from '../controllers/questionTypeController';

const router = Router();

/**
 * @openapi
 * /question-types:
 *   get:
 *     tags:
 *       - QuestionTypes
 *     summary: Listar tipos de pregunta
 *     parameters:
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
 *         description: Colección paginada de tipos de pregunta.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListQuestionTypesResponse'
 *   post:
 *     tags:
 *       - QuestionTypes
 *     summary: Crear un tipo de pregunta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQuestionTypeInput'
 *     responses:
 *       201:
 *         description: Tipo de pregunta creado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuestionType'
 */
router.get('/question-types', listQuestionTypes);
router.post('/question-types', createQuestionType);

/**
 * @openapi
 * /question-types/{questionTypeId}:
 *   get:
 *     tags:
 *       - QuestionTypes
 *     summary: Obtener tipo de pregunta por id
 *     parameters:
 *       - in: path
 *         name: questionTypeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tipo de pregunta encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuestionType'
 *   patch:
 *     tags:
 *       - QuestionTypes
 *     summary: Actualizar tipo de pregunta
 *     parameters:
 *       - in: path
 *         name: questionTypeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQuestionTypeInput'
 *     responses:
 *       200:
 *         description: Tipo de pregunta actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QuestionType'
 *   delete:
 *     tags:
 *       - QuestionTypes
 *     summary: Eliminar tipo de pregunta
 *     parameters:
 *       - in: path
 *         name: questionTypeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Eliminado correctamente.
 */
router.get('/question-types/:questionTypeId', getQuestionTypeById);
router.patch('/question-types/:questionTypeId', updateQuestionType);
router.delete('/question-types/:questionTypeId', deleteQuestionType);

export default router;
