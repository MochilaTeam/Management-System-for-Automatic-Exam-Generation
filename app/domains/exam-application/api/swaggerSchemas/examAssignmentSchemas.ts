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
 *     AssignExamToCourseResponse:
 *       type: object
 *       properties:
 *         examId:
 *           type: string
 *           format: uuid
 *         courseId:
 *           type: string
 *           format: uuid
 *         assignmentsCreated:
 *           type: integer
 *           description: Número de estudiantes a los que se les asignó el examen
 *           example: 25
 *         applicationDate:
 *           type: string
 *           format: date-time
 *         durationMinutes:
 *           type: integer
 *           example: 90
 *         examStatus:
 *           type: string
 *           enum: [published]
 *           description: Nuevo estado del examen (PUBLISHED)
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
 *     ExamResponseInput:
 *       type: object
 *       required:
 *         - examQuestionId
 *       properties:
 *         examQuestionId:
 *           type: string
 *           format: uuid
 *           description: ID de la pregunta del examen (ExamQuestion)
 *         selectedOptionId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID de la opción seleccionada (para preguntas de selección)
 *         textAnswer:
 *           type: string
 *           nullable: true
 *           description: Respuesta de texto (para preguntas abiertas)
 *     ExamResponseOutput:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         examQuestionId:
 *           type: string
 *           format: uuid
 *         studentId:
 *           type: string
 *           format: uuid
 *         selectedOptionId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         textAnswer:
 *           type: string
 *           nullable: true
 *         autoPoints:
 *           type: number
 *           description: Puntos calculados automáticamente
 *         manualPoints:
 *           type: number
 *           nullable: true
 *           description: Puntos asignados manualmente (si aplica)
 *         answeredAt:
 *           type: string
 *           format: date-time
 *     ExamResponseSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/ExamResponseOutput'
 */
