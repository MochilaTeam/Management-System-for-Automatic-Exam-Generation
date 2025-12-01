import { Router } from 'express';

import { authenticate } from '../../../../core/middlewares/authenticate';
import { requireRoles } from '../../../../core/middlewares/authorize';
import { Roles } from '../../../../shared/enums/rolesEnum';
import { requestExamRegrade } from '../controllers/examRegradeController';

const router = Router();

/**
 * @openapi
 * /exams/regrade-requests:
 *   post:
 *     tags: [Exam Regrade]
 *     summary: Solicitar recalificación de un examen
 *     description: |
 *       Permite a un estudiante solicitar la recalificación de un examen que ya ha sido calificado.
 *       Crea un nuevo registro ExamRegrade con estado REQUESTED.
 *
 *       **Lógica interna (a implementar):**
 *       1. Validar que el estudiante (autenticado) tiene una asignación para el examen solicitado.
 *       2. Validar que el examen ya ha sido calificado (ExamAssignment.status = GRADED).
 *       3. Validar que NO existe ya una solicitud de recalificación pendiente o en revisión para este examen:
 *          - Buscar ExamRegrade con examId y studentId donde status IN (REQUESTED, IN_REVIEW).
 *          - Si existe, retornar error 400 indicando que ya hay una solicitud activa.
 *       4. Validar que el profesor especificado existe y tiene permisos (si necesitara) para calificar este examen.
 *       5. Crear registro en ExamRegrades con:
 *          - studentId: ID del estudiante autenticado
 *          - examId: del body
 *          - professorId: del body
 *          - reason: del body (opcional)
 *          - status: REQUESTED
 *          - requestedAt: fecha actual
 *       6. Retornar el registro creado.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestExamRegradeInput'
 *     responses:
 *       201:
 *         description: Solicitud de recalificación creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ExamRegradeOutput'
 *       400:
 *         description: Error de validación (examen no calificado, solicitud duplicada, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   examples:
 *                     - El examen aún no ha sido calificado
 *                     - Ya existe una solicitud de recalificación activa para este examen
 *       404:
 *         description: Examen o profesor no encontrado
 *       403:
 *         description: No autorizado (no es estudiante o no está asignado al examen)
 */
router.post(
    '/exams/regrade-requests',
    authenticate,
    requireRoles(Roles.STUDENT),
    requestExamRegrade,
);

export default router;
