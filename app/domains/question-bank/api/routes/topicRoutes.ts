import { Router } from "express";
import { createTopic, deleteTopic, getTopicById, listTopics, updateTopic } from "../controllers/topicController";

const router = Router();

/**
 * @openapi
 * /topics:
 *   get:
 *     tags: [Topics]
 *     summary: Listar tópicos (detalle)
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Búsqueda por nombre (like).
 *       - in: query
 *         name: subject_id
 *         schema: { type: string, format: uuid }
 *         description: Filtra por subject asociado.
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0, minimum: 0 }
 *     responses:
 *       200:
 *         description: Colección paginada de TopicDetail.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TopicDetail'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     limit: { type: integer }
 *                     offset: { type: integer }
 *                     total: { type: integer }
 *   post:
 *     tags: [Topics]
 *     summary: Crear tópico (asociado inicialmente a un subject)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject_associated_id: { type: string, format: uuid }
 *               topic_name: { type: string }
 *             required: [subject_associated_id, topic_name]
 *     responses:
 *       201:
 *         description: Tópico creado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/TopicDetail' }
 *                 success: { type: boolean }
 */
router.get("/topics", listTopics);
router.post("/topics", createTopic);

/**
 * @openapi
 * /topics/{topicId}:
 *   get:
 *     tags: [Topics]
 *     summary: Obtener tópico por id (detalle)
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detalle del tópico.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/TopicDetail' }
 *                 success: { type: boolean }
 *   patch:
 *     tags: [Topics]
 *     summary: Actualizar tópico
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic_name: { type: string }
 *     responses:
 *       200:
 *         description: Tópico actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/TopicDetail' }
 *                 success: { type: boolean }
 *   delete:
 *     tags: [Topics]
 *     summary: Eliminar tópico
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Eliminado correctamente.
 */
router.get("/topics/:topicId", getTopicById);
router.patch("/topics/:topicId", updateTopic);
router.delete("/topics/:topicId", deleteTopic);

export default router;
