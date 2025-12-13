import { Router } from 'express';

import { authenticate } from '../../../../core/middlewares/authenticate';
import { requireRoles } from '../../../../core/middlewares/authorize';
import { Roles } from '../../../../shared/enums/rolesEnum';
import {
    compareExams,
    getExamPerformance,
    getSubjectDifficulty,
    listAutomaticExams,
    listPopularQuestions,
    listReviewerActivity,
    listValidatedExams,
} from '../controllers/analyticsController';

const router = Router();

// Scope auth/authorization only to analytics endpoints to avoid affecting other routes.
router.use('/analytics', authenticate, requireRoles(Roles.ADMIN, Roles.SUBJECT_LEADER));

/**
 * @openapi
 * /analytics/reports/automatic-exams:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Obtener exámenes automáticos generados para una asignatura
 *     description: Devuelve los parámetros y metadatos de los exámenes con modo automático.
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, subjectName, creatorName]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *     responses:
 *       200:
 *         description: Reporte paginado de exámenes automáticos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AutomaticExamReportResponse'
 */
router.get('/analytics/reports/automatic-exams', listAutomaticExams);
/**
 * @openapi
 * /analytics/reports/popular-questions:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Obtener preguntas más utilizadas en exámenes finales
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [usageCount, difficulty, topicName]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *     responses:
 *       200:
 *         description: Preguntas ordenadas por uso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PopularQuestionsReportResponse'
 */
router.get('/analytics/reports/popular-questions', listPopularQuestions);
/**
 * @openapi
 * /analytics/reports/validated-exams:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Listar exámenes validados por un revisor
 *     parameters:
 *       - in: query
 *         name: reviewerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [validatedAt, subjectName]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *     responses:
 *       200:
 *         description: Lista de exámenes validados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidatedExamsReportResponse'
 */
router.get('/analytics/reports/validated-exams', listValidatedExams);
/**
 * @openapi
 * /analytics/reports/exam-performance/{examId}:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Reporte de desempeño de estudiantes por examen
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *     responses:
 *       200:
 *         description: Métricas por pregunta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamPerformanceReportResponse'
 */
router.get('/analytics/reports/exam-performance/:examId', getExamPerformance);
/**
 * @openapi
 * /analytics/reports/subject-difficulty:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Correlación entre dificultad y rendimiento por asignatura
 *     parameters:
 *       - in: query
 *         name: subjectIds
 *         description: Lista separada por comas de asignaturas
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [subjectName]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *     responses:
 *       200:
 *         description: Correlaciones y estadísticas de dificultad
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubjectDifficultyReportResponse'
 */
router.get('/analytics/reports/subject-difficulty', getSubjectDifficulty);
/**
 * @openapi
 * /analytics/reports/exam-comparison:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Comparar distribución de preguntas entre asignaturas
 *     parameters:
 *       - in: query
 *         name: subjectIds
 *         description: IDs separados por comas
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [subjectName, examTitle, createdAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: balanceThreshold
 *         schema:
 *           type: number
 *           default: 0.2
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *     responses:
 *       200:
 *         description: Distribución de preguntas y balance por examen
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExamComparisonReportResponse'
 */
router.get('/analytics/reports/exam-comparison', compareExams);
/**
 * @openapi
 * /analytics/reports/reviewer-activity:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Actividad reciente de revisores
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [reviewedExams, teacherName, subjectName]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf]
 *     responses:
 *       200:
 *         description: Número de exámenes revisados por profesor y asignatura
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewerActivityReportResponse'
 */
router.get('/analytics/reports/reviewer-activity', listReviewerActivity);

export default router;
