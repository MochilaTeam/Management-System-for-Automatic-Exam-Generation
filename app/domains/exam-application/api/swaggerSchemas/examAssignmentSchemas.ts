/**
 * @openapi
 * components:
 *   schemas:
 *     AssignExamToCourseInput:
 *       type: object
 *       required:
 *         - studentIds
 *         - applicationDate
 *         - durationMinutes
 *       properties:
 *         studentIds:
 *           type: array
 *           minItems: 1
 *           description: Lista de IDs de estudiantes a los que se asignará el examen
 *           items:
 *             type: string
 *             format: uuid
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
 *     AssignExamToCourseResponse:
 *       type: object
 *       properties:
 *         examId:
 *           type: string
 *           format: uuid
 *         assignedStudentIds:
 *           type: array
 *           description: IDs de los estudiantes a los que se asignó el examen
 *           items:
 *             type: string
 *             format: uuid
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
 *           enum: [PENDING, ENABLED, IN_EVALUATION, SUBMITTED, GRADED, CANCELLED]
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
 *         grade:
 *           type: number
 *           nullable: true
 *           description: Nota final obtenida (si ya está evaluado)
 *           example: 18.5
 *     ExamResponseInput:
 *       type: object
 *       required:
 *         - examId
 *         - examQuestionId
 *       properties:
 *         examId:
 *           type: string
 *           format: uuid
 *           description: ID del examen
 *         examQuestionId:
 *           type: string
 *           format: uuid
 *           description: ID de la pregunta del examen (ExamQuestion)
 *         selectedOptions:
 *           type: array
 *           nullable: true
 *           description: Opciones seleccionadas por el estudiante
 *           items:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               isCorrect:
 *                 type: boolean
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
 *         examId:
 *           type: string
 *           format: uuid
 *         examQuestionId:
 *           type: string
 *           format: uuid
 *         studentId:
 *           type: string
 *           format: uuid
 *         selectedOptions:
 *           type: array
 *           nullable: true
 *           items:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               isCorrect:
 *                 type: boolean
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
 *     CalculateExamGradeResult:
 *       type: object
 *       properties:
 *         assignmentId:
 *           type: string
 *           format: uuid
 *         examId:
 *           type: string
 *           format: uuid
 *         studentId:
 *           type: string
 *           format: uuid
 *         finalGrade:
 *           type: number
 *         examTotalScore:
 *           type: number
 *       required:
 *         - assignmentId
 *         - examId
 *         - studentId
 *         - finalGrade
 *         - examTotalScore
 *     RequestExamRegradeInput:
 *       type: object
 *       required:
 *         - examId
 *         - professorId
 *       properties:
 *         examId:
 *           type: string
 *           format: uuid
 *           description: ID del examen para el cual se solicita recalificación
 *         professorId:
 *           type: string
 *           format: uuid
 *           description: ID del profesor al que se solicita la recalificación
 *         reason:
 *           type: string
 *           nullable: true
 *           minLength: 10
 *           description: Razón de la solicitud de recalificación
 *           example: "Considero que la pregunta 5 fue calificada incorrectamente"
 *     ExamRegradeOutput:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         studentId:
 *           type: string
 *           format: uuid
 *         examId:
 *           type: string
 *           format: uuid
 *         professorId:
 *           type: string
 *           format: uuid
 *         reason:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [REQUESTED, IN_REVIEW, RESOLVED, REJECTED]
 *           description: Estado de la solicitud de recalificación
 *         requestedAt:
 *           type: string
 *           format: date-time
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         finalGrade:
 *           type: number
 *           nullable: true
 */
