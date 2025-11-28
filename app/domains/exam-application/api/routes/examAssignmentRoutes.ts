import { Router } from 'express';

import { authenticate } from '../../../../core/middlewares/authenticate';
import { requireRoles } from '../../../../core/middlewares/authorize';
import { Roles } from '../../../../shared/enums/rolesEnum';

const router = Router();

/**
 * @openapi
 * /exams/{examId}/assign-to-course:
 *   post:
 *     tags: [Exam Assignment]
 *     summary: Asignar un examen aprobado a un curso¡
 *     description: |
 *       Este endpoint permite a un profesor asignar un examen con estado APPROVED a todos los estudiantes de un curso.
 *
 *       **Lógica interna (a implementar):**
 *       1. Validar que el examen existe y tiene estado APPROVED
 *       2. Validar que el profesor tiene permisos sobre el curso
 *       3. Obtener todos los estudiantes activos del curso
 *       4. Crear un registro ExamAssignment por cada estudiante con:
 *          - studentId: ID del estudiante
 *          - examId: ID del examen
 *          - professorId: ID del profesor que asigna
 *          - durationMinutes: duración del examen
 *          - applicationDate: fecha de aplicación
 *          - status: PENDING (inicialmente)
 *       5. Cambiar el estado del examen de APPROVED a PUBLISHED
 *       6. Retornar el número de asignaciones creadas y detalles del examen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del examen a asignar (debe tener estado APPROVED)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignExamToCourseInput'
 *     responses:
 *       201:
 *         description: Examen asignado correctamente a todos los estudiantes del curso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     examId:
 *                       type: string
 *                       format: uuid
 *                     courseId:
 *                       type: string
 *                       format: uuid
 *                     assignmentsCreated:
 *                       type: integer
 *                       description: Número de estudiantes a los que se les asignó el examen
 *                       example: 25
 *                     applicationDate:
 *                       type: string
 *                       format: date-time
 *                     durationMinutes:
 *                       type: integer
 *                       example: 90
 *                     examStatus:
 *                       type: string
 *                       enum: [published]
 *                       description: Nuevo estado del examen (PUBLISHED)
 *       400:
 *         description: Error en la validación de datos o el examen no está en estado APPROVED
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
 *                     - El examen debe tener estado APPROVED para ser asignado
 *                     - El curso no tiene estudiantes activos
 *       404:
 *         description: Examen o curso no encontrado
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
 *                   example: Examen no encontrado
 *       403:
 *         description: El profesor no tiene permisos sobre el curso
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
 *                   example: No tienes permisos para asignar exámenes a este curso
 */

//TODO: guardar tambien curso en ExamAssignment
router.post(
    '/exams/:examId/assign-to-course',
    authenticate,
    requireRoles(Roles.TEACHER),
    assignExamToCourse,
);

/**
 * @openapi
 * /exams/my-assignments:
 *   get:
 *     tags: [Exam Assignment]
 *     summary: Listar mis exámenes asignados
 *     description: |
 *       Permite a un estudiante obtener la lista de exámenes que le han sido asignados.
 *       Incluye paginación y filtros por estado y asignatura.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de elementos por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ENABLED, SUBMITTED, GRADED, CANCELLED]
 *         description: Filtrar por estado de la asignación
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por ID de la asignatura
 *     responses:
 *       200:
 *         description: Lista de exámenes asignados obtenida correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudentExamAssignmentListResponse'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       403:
 *         description: No autorizado (no es estudiante)
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
 *                   example: Acceso denegado
 */
router.get('/exams/my-assignments', authenticate, requireRoles(Roles.STUDENT), listStudentExams);

export default router;
