/**
 * @openapi
 * components:
 *   schemas:
 *     AssignExamToCourseInput:
 *       type: object
 *       required:
 *         - courseId
 *         - applicationDate
 *         - durationMinutes
 *       properties:
 *         courseId:
 *           type: string
 *           format: uuid
 *           description: ID del curso al que se asignará el examen
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         applicationDate:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora en que se aplicará el examen
 *           example: "2025-12-15T10:00:00Z"
 *         durationMinutes:
 *           type: integer
 *           minimum: 1
 *           maximum: 480
 *           description: Duración del examen en minutos (máximo 8 horas)
 *           example: 90
 *         allowLateSubmission:
 *           type: boolean
 *           default: false
 *           description: Indica si se permite entrega tardía
 *           example: false
 *         lateSubmissionPenalty:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           nullable: true
 *           description: Penalización en porcentaje por entrega tardía
 *           example: 10
 *         instructions:
 *           type: string
 *           nullable: true
 *           description: Instrucciones especiales para los estudiantes
 *           example: "Favor de leer cuidadosamente cada pregunta antes de responder"
 *     StudentExamAssignmentListResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID de la asignación (ExamAssignment)
 *         examId:
 *           type: string
 *           format: uuid
 *           description: ID del examen
 *         subjectName:
 *           type: string
 *           description: Nombre de la asignatura
 *           example: "Matemáticas Avanzadas"
 *         professorName:
 *           type: string
 *           description: Nombre del profesor que asignó el examen
 *           example: "Juan Pérez"
 *         status:
 *           type: string
 *           enum: [PENDING, ENABLED, SUBMITTED, GRADED, CANCELLED]
 *           description: Estado de la asignación
 *           example: "PENDING"
 *         applicationDate:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora programada para el examen
 *         durationMinutes:
 *           type: integer
 *           description: Duración del examen en minutos
 *           example: 90
 */
