import { Router } from "express";
import {
  createSubtopic,
  deleteSubtopic,
  getSubtopicById,
  listSubtopics,
} from "../controllers/subtopicController";

const router = Router();

/**
 * @openapi
 * /subtopics:
 *   get:
 *     tags: [Subtopics]
 *     summary: Listar subtemas (detalle)
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Búsqueda por subtopic_name (like).
 *       - in: query
 *         name: topic_id
 *         schema: { type: string, format: uuid }
 *         description: Filtra por topic asociado.
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0, minimum: 0 }
 *     responses:
 *       200:
 *         description: Colección paginada de SubtopicDetail.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubtopicDetail'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     limit: { type: integer }
 *                     offset: { type: integer }
 *                     total: { type: integer }
 *   post:
 *     tags: [Subtopics]
 *     summary: Crear subtema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic_associated_id: { type: string, format: uuid }
 *               subtopic_name: { type: string }
 *             required: [topic_associated_id, subtopic_name]
 *     responses:
 *       201:
 *         description: Subtema creado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/SubtopicDetail' }
 *                 success: { type: boolean }
 */
router.get("/subtopics", listSubtopics);
router.post("/subtopics", createSubtopic);

/**
 * @openapi
 * /subtopics/{subtopicId}:
 *   get:
 *     tags: [Subtopics]
 *     summary: Obtener subtema por id
 *     parameters:
 *       - in: path
 *         name: subtopicId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detalle del subtema.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/SubtopicDetail' }
 *                 success: { type: boolean }
 *   delete:
 *     tags: [Subtopics]
 *     summary: Eliminar subtema
 *     parameters:
 *       - in: path
 *         name: subtopicId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Eliminado correctamente.
 */
router.get("/subtopics/:subtopicId", getSubtopicById);
router.delete("/subtopics/:subtopicId", deleteSubtopic);

export default router;
