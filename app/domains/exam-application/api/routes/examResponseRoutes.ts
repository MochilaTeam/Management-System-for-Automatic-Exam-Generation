import { Router } from 'express';
import { authenticate } from '../../../../core/middlewares/authenticate';
import { requireRoles } from '../../../../core/middlewares/authorize';
import { Roles } from '../../../../shared/enums/rolesEnum';

// import { createExamResponse, updateExamResponse } from '../controllers/examResponseController';

const router = Router();

/**
 * @openapi
 * /exams/responses:
 *   post:
 *     tags: [Exam Responses]
 *     summary: Enviar respuesta a una pregunta de examen
 *     description: |
 *       Permite a un estudiante guardar su respuesta a una pregunta específica de un examen activo.
 *       Calcula automáticamente los puntos si es posible (ej. selección múltiple).
 *       
 *       **Lógica interna (a implementar):**
 *       1. Validar que el estudiante tiene una asignación (ExamAssignment) para el examen de la pregunta.
 *       2. Validar que el examen está en curso (fecha actual entre inicio y fin calculado).
 *       3. Verificar si ya existe una respuesta para esa pregunta y estudiante (si sí, error o actualizar).
 *       4. Calcular `autoPoints`:
 *          - Obtener la `Question` original.
 *          - Si es selección múltiple/única:
 *            - Comparar `selectedOptionId` con las opciones correctas de la pregunta.
 *            - Si coincide, asignar puntos totales de la pregunta (o parciales según lógica).
 *            - Si no, 0 puntos.
 *          - Si es texto libre: `autoPoints` = 0 (requiere calificación manual).
 *       5. Crear registro en `ExamResponses` con `answeredAt` = now().
 *       6. Retornar la respuesta creada.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamResponseInput'
 *     responses:
 *       201:
 *         description: Respuesta guardada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamResponseSuccessResponse'
 *       400:
 *         description: Error de validación o examen no activo
 *       403:
 *         description: No autorizado o no asignado al examen
 */
router.post('/exams/responses', authenticate, requireRoles(Roles.STUDENT), createExamResponse);

/**
 * @openapi
 * /exams/responses/{responseId}:
 *   put:
 *     tags: [Exam Responses]
 *     summary: Actualizar respuesta a una pregunta
 *     description: |
 *       Permite a un estudiante modificar su respuesta si el examen sigue activo.
 *       Recalcula los puntos automáticos.
 *       
 *       **Lógica interna (a implementar):**
 *       1. Buscar la respuesta por ID y verificar que pertenezca al estudiante.
 *       2. Validar que el examen sigue activo.
 *       3. Recalcular `autoPoints` con los nuevos datos (igual que en POST).
 *       4. Actualizar registro en `ExamResponses` y actualizar `answeredAt`.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: responseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExamResponseInput'
 *     responses:
 *       200:
 *         description: Respuesta actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamResponseSuccessResponse'
 *       400:
 *         description: Error de validación o examen finalizado
 *       404:
 *         description: Respuesta no encontrada
 */
// router.put('/exams/responses/:responseId', authenticate, requireRoles(Roles.STUDENT), updateExamResponse);

export default router;
