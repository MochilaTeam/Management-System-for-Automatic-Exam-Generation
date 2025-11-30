import { Router } from 'express';

import { authenticate } from '../../../../core/middlewares/authenticate';
import { requireRoles } from '../../../../core/middlewares/authorize';
import { Roles } from '../../../../shared/enums/rolesEnum';
import { createExamAssignment, listStudentExams } from '../controllers/examAssignmentsControllers';

const router = Router();

/**
 * @openapi
 * /exams/{examId}/assign-to-course:
 *   post:
 *     tags: [Exam Assignment]
 *     summary: Asignar un examen aprobado a estudiantes específicos
 *     description: |
 *       Este endpoint permite a un profesor asignar un examen con estado APPROVED a una lista controlada de estudiantes.
 *       Los estudiantes deben enviarse en el body como un arreglo `studentIds`.
 *
 *       **Lógica interna (a implementar):**
 *       1. Validar que el examen existe y tiene estado APPROVED
 *       2. Validar que el profesor tiene permisos sobre la asignatura del examen
 *       3. Validar que la lista de estudiantes exista y esté activa
 *       4. Crear un registro ExamAssignment por cada estudiante con:
 *          - studentId: ID del estudiante
 *          - examId: ID del examen
 *          - professorId: ID del profesor que asigna
 *          - durationMinutes: duración del examen
 *          - applicationDate: fecha de aplicación
 *          - status: PENDING (inicialmente)
 *       5. Cambiar el estado del examen de APPROVED a PUBLISHED
 *       6. Retornar la cantidad de asignaciones creadas y detalles del examen
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
 *         description: Examen asignado correctamente a los estudiantes seleccionados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssignExamToCourseResponse'
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
 *                     - La lista de estudiantes no contiene alumnos válidos
 *       404:
 *         description: Examen o estudiantes no encontrados
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
 *         description: El profesor no tiene permisos sobre la asignatura
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
 *                   example: No tienes permisos para asignar exámenes a esta asignatura
 */

router.post(
    '/exams/:examId/assign-to-course',
    authenticate,
    requireRoles(Roles.TEACHER),
    createExamAssignment,
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
 *       Incluye información de tablas adicinales como el nombre de el profesor que asignó el examen
 *       y el nombre de la asignatura.
 *       Al recargar los examenes se actualizan los estados de los mismos.
 *          Un examen se considera PENDING si su fecha de aplicación es mayor a la fecha actual.
 *          Un examen se considera ENABLED si su fecha de aplicación es menor a la fecha actual y la fecha actual es mayor a la fecha de aplicación + la duración del examen.
 *          Un examen se considera SUBMITTED si su fecha de aplicación es menor a la fecha actual y el estudiante ha respondido el examen.
 *          Un examen se considera GRADED si su fecha de aplicación es menor a la fecha actual y el examen ha sido calificado.
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
