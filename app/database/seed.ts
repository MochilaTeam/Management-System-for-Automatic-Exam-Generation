import { sequelize } from './database';
import { getHasher } from '../core/security/hasher';
import { AssignedExamStatus } from '../domains/exam-application/entities/enums/AssignedExamStatus';
import { ExamRegradesStatus } from '../domains/exam-application/entities/enums/ExamRegradeStatus';
import { ExamStatusEnum } from '../domains/exam-application/entities/enums/ExamStatusEnum';
import { DifficultyLevelEnum } from '../domains/question-bank/entities/enums/DifficultyLevels';
import { QuestionTypeEnum } from '../domains/question-bank/entities/enums/QuestionType';
import ExamAssignment from '../infrastructure/exam-application/models/ExamAssignment';
import ExamRegrade from '../infrastructure/exam-application/models/ExamRegrade';
import ExamResponse from '../infrastructure/exam-application/models/ExamResponse';
import Exam from '../infrastructure/exam-generation/models/Exam';
import ExamQuestion from '../infrastructure/exam-generation/models/ExamQuestion';
import {
    Subject,
    Topic,
    SubTopic as Subtopic,
    SubjectTopic,
} from '../infrastructure/question-bank/models';
import LeaderSubject from '../infrastructure/question-bank/models/LeaderSubject';
import Question from '../infrastructure/question-bank/models/Question';
import QuestionType from '../infrastructure/question-bank/models/QuestionType';
import TeacherSubject from '../infrastructure/question-bank/models/TeacherSubject';
import { Student, Teacher, User } from '../infrastructure/user/models';
import { Roles } from '../shared/enums/rolesEnum';

// --- DATA DEFINITIONS ---

const USERS = {
    ADMIN: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'administrador123',
    },
    STUDENT: {
        name: 'Estudiante Prueba',
        email: 'student@example.com',
        password: 'estudiante123',
        age: 22,
        course: '3',
    },
    TEACHERS: [
        {
            name: 'Profesor Uno',
            email: 'teacher1@example.com',
            password: 'profesor123',
            roles: { examiner: true, subjectLeader: true },
            specialty: 'Bases de Datos',
            subject: 'Bases de Datos',
        },
        {
            name: 'Profesor Dos',
            email: 'teacher2@example.com',
            password: 'profesor123',
            roles: { examiner: false, subjectLeader: true },
            specialty: 'Ingeniería de Software',
            subject: 'Ingeniería de Software',
        },
        {
            name: 'Profesor Tres',
            email: 'teacher3@example.com',
            password: 'profesor123',
            roles: { examiner: true, subjectLeader: false },
            specialty: 'Ingeniería de Software',
            subject: 'Ingeniería de Software',
        },
        {
            name: 'Profesor Cuatro',
            email: 'teacher4@example.com',
            password: 'profesor123',
            roles: { examiner: false, subjectLeader: false },
            specialty: 'Ingeniería de Software',
            subject: 'Ingeniería de Software',
        },
    ],
};

const SUBJECTS = [
    {
        name: 'Ingeniería de Software',
        program: 'Programa 2025 - IS',
        topics: [
            {
                title: 'Ciclo de Vida del Software',
                subtopics: ['Modelos de Desarrollo', 'Metodologías Ágiles', 'Requisitos'],
            },
            {
                title: 'Diseño y Arquitectura',
                subtopics: ['Patrones de Diseño', 'UML', 'Arquitectura de Microservicios'],
            },
            {
                title: 'Calidad y Pruebas',
                subtopics: ['Tipos de Pruebas', 'QA vs QC', 'Automatización'],
            },
        ],
    },
    {
        name: 'Bases de Datos',
        program: 'Programa 2025 - BD',
        topics: [
            {
                title: 'Modelo Relacional',
                subtopics: ['Normalización', 'Diagramas ER', 'Integridad Referencial'],
            },
            {
                title: 'SQL Avanzado',
                subtopics: ['Joins y Subconsultas', 'Procedimientos Almacenados', 'Triggers'],
            },
            {
                title: 'NoSQL',
                subtopics: ['MongoDB', 'Teorema CAP', 'Modelado de Documentos'],
            },
        ],
    },
];

// Helper to generate questions
const generateQuestions = (
    subtopicId: string,
    authorId: string,
    typeMap: Record<QuestionTypeEnum, string>,
) => {
    const questions = [];
    const difficulties = Object.values(DifficultyLevelEnum);

    // Create 3 questions per difficulty per type
    for (const diff of difficulties) {
        // MCQ
        questions.push({
            subTopicId: subtopicId,
            authorId,
            questionTypeId: typeMap[QuestionTypeEnum.MCQ],
            difficulty: diff,
            body: `Pregunta MCQ de ${diff} dificultad sobre este subtema.`,
            options: [
                { text: 'Opción Correcta', isCorrect: true },
                { text: 'Opción Incorrecta 1', isCorrect: false },
                { text: 'Opción Incorrecta 2', isCorrect: false },
                { text: 'Opción Incorrecta 3', isCorrect: false },
            ],
        });

        // True/False
        questions.push({
            subTopicId: subtopicId,
            authorId,
            questionTypeId: typeMap[QuestionTypeEnum.TRUE_FALSE],
            difficulty: diff,
            body: `Enunciado Verdadero/Falso de ${diff} dificultad. (Es verdadero)`,
            options: [
                { text: 'Verdadero', isCorrect: true },
                { text: 'Falso', isCorrect: false },
            ],
        });

        // Essay
        questions.push({
            subTopicId: subtopicId,
            authorId,
            questionTypeId: typeMap[QuestionTypeEnum.ESSAY],
            difficulty: diff,
            body: `Pregunta abierta de ${diff} dificultad. Explique detalladamente.`,
            response: 'Respuesta esperada de referencia.',
        });
    }
    return questions;
};

async function seed() {
    console.log('Iniciando seed...');
    await sequelize.authenticate();

    // Force sync to clear data (be careful in prod, but this is seed)
    // Actually, let's just use a transaction and standard creation.
    // If we want to clear, we might need to truncate.
    // For this task, "sobrescribiendo el actual" implies we want fresh data.
    // I'll use `force: true` on sync if possible, but usually seed just inserts.
    // Let's try to destroy all data first to be safe.

    const t = await sequelize.transaction();

    try {
        // Clean up (reverse order of dependencies)
        await ExamRegrade.destroy({ where: {}, transaction: t });
        await ExamResponse.destroy({ where: {}, transaction: t });
        await ExamAssignment.destroy({ where: {}, transaction: t });
        await ExamQuestion.destroy({ where: {}, transaction: t });
        await Exam.destroy({ where: {}, transaction: t });
        await Question.destroy({ where: {}, transaction: t });
        await Subtopic.destroy({ where: {}, transaction: t });
        await SubjectTopic.destroy({ where: {}, transaction: t });
        await Topic.destroy({ where: {}, transaction: t });
        await TeacherSubject.destroy({ where: {}, transaction: t });
        await LeaderSubject.destroy({ where: {}, transaction: t });
        await Subject.destroy({ where: {}, transaction: t });
        await Student.destroy({ where: {}, transaction: t });
        await Teacher.destroy({ where: {}, transaction: t });
        await User.destroy({ where: {}, transaction: t });
        await QuestionType.destroy({ where: {}, transaction: t });

        const hasher = getHasher();

        // 1. Create Question Types
        const questionTypeMap: Record<QuestionTypeEnum, string> = {
            [QuestionTypeEnum.MCQ]: '',
            [QuestionTypeEnum.TRUE_FALSE]: '',
            [QuestionTypeEnum.ESSAY]: '',
        };
        for (const qt of Object.values(QuestionTypeEnum)) {
            const [qType] = await QuestionType.findOrCreate({
                where: { name: qt },
                defaults: { name: qt },
                transaction: t,
            });
            questionTypeMap[qt as QuestionTypeEnum] = qType.id;
        }

        // 2. Create Users
        // Admin
        const adminHash = await hasher.hash(USERS.ADMIN.password);
        await User.create(
            {
                name: USERS.ADMIN.name,
                email: USERS.ADMIN.email,
                passwordHash: adminHash,
                role: Roles.ADMIN,
            },
            { transaction: t },
        );

        // Student
        const studentHash = await hasher.hash(USERS.STUDENT.password);
        const studentUser = await User.create(
            {
                name: USERS.STUDENT.name,
                email: USERS.STUDENT.email,
                passwordHash: studentHash,
                role: Roles.STUDENT,
            },
            { transaction: t },
        );

        const studentProfile = await Student.create(
            {
                userId: studentUser.id,
                age: USERS.STUDENT.age,
                course: USERS.STUDENT.course,
            },
            { transaction: t },
        );

        // Teachers
        const teacherMap = new Map<string, Teacher>();
        const teacherUserMap = new Map<string, User>();

        for (const tData of USERS.TEACHERS) {
            const hash = await hasher.hash(tData.password);
            const user = await User.create(
                {
                    name: tData.name,
                    email: tData.email,
                    passwordHash: hash,
                    role: Roles.TEACHER,
                },
                { transaction: t },
            );

            const teacher = await Teacher.create(
                {
                    userId: user.id,
                    specialty: tData.specialty,
                    hasRoleSubjectLeader: tData.roles.subjectLeader,
                    hasRoleExaminer: tData.roles.examiner,
                },
                { transaction: t },
            );

            teacherMap.set(tData.email, teacher);
            teacherUserMap.set(tData.email, user);
        }

        // 3. Create Subjects & Topics & Questions
        const subjectMap = new Map<string, Subject>();
        const allQuestions: Question[] = [];
        const questionsBySubject = new Map<string, Question[]>();

        for (const sData of SUBJECTS) {
            // Find lead teacher (Teacher 1 for BD, Teacher 2 for IS)
            let leadEmail = '';
            if (sData.name === 'Bases de Datos') leadEmail = 'teacher1@example.com';
            if (sData.name === 'Ingeniería de Software') leadEmail = 'teacher2@example.com';

            const leadTeacher = teacherMap.get(leadEmail);
            if (!leadTeacher) throw new Error(`Lead teacher not found for ${sData.name}`);

            const subject = await Subject.create(
                {
                    name: sData.name,
                    program: sData.program,
                    leadTeacherId: leadTeacher.id,
                },
                { transaction: t },
            );

            subjectMap.set(sData.name, subject);
            questionsBySubject.set(sData.name, []);

            // Assign LeaderSubject
            await LeaderSubject.create(
                {
                    subjectId: subject.id,
                    teacherId: leadTeacher.id,
                },
                { transaction: t },
            );

            // Assign Teachers to Subject
            // P1 -> BD, P2, P3, P4 -> IS
            for (const tData of USERS.TEACHERS) {
                if (tData.subject === sData.name) {
                    const teacher = teacherMap.get(tData.email);
                    if (teacher) {
                        await TeacherSubject.create(
                            {
                                subjectId: subject.id,
                                teacherId: teacher.id,
                            },
                            { transaction: t },
                        );
                    }
                }
            }

            // Topics & Questions
            for (const topicData of sData.topics) {
                const topic = await Topic.create({ title: topicData.title }, { transaction: t });
                await SubjectTopic.create(
                    { subjectId: subject.id, topicId: topic.id },
                    { transaction: t },
                );

                for (const subName of topicData.subtopics) {
                    const subtopic = await Subtopic.create(
                        {
                            name: subName,
                            topicId: topic.id,
                        },
                        { transaction: t },
                    );

                    const questionsData = generateQuestions(
                        subtopic.id,
                        leadTeacher.id,
                        questionTypeMap,
                    );

                    for (const qData of questionsData) {
                        const question = await Question.create(qData, { transaction: t });
                        allQuestions.push(question);
                        questionsBySubject.get(sData.name)?.push(question);
                    }
                }
            }
        }

        // 4. Create Exams
        // Helper to pick questions for 100 points
        const createExamQuestions = async (examId: string, subjectName: string, count: number) => {
            const subjectQuestions = questionsBySubject.get(subjectName) || [];
            // Shuffle
            const shuffled = subjectQuestions.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, count);

            // Distribute 100 points
            // Simple logic: 100 / count. If not integer, adjust last.
            const baseScore = Math.floor(100 / count);
            const remainder = 100 % count;

            const examQuestions = [];
            for (let i = 0; i < selected.length; i++) {
                const score = i < remainder ? baseScore + 1 : baseScore;
                const eq = await ExamQuestion.create(
                    {
                        examId,
                        questionId: selected[i].id,
                        questionIndex: i + 1,
                        questionScore: score,
                    },
                    { transaction: t },
                );
                examQuestions.push(eq);
            }
            return examQuestions;
        };

        const examsToCreate = [
            // IS Exams
            {
                title: 'IS - Examen Activo (P2)',
                subject: 'Ingeniería de Software',
                status: ExamStatusEnum.PUBLISHED,
                authorEmail: 'teacher2@example.com',
                validatorEmail: 'teacher2@example.com',
                qCount: 5,
            },
            {
                title: 'IS - Examen Grading (P3)',
                subject: 'Ingeniería de Software',
                status: ExamStatusEnum.PUBLISHED,
                authorEmail: 'teacher3@example.com', // P3 is examiner
                validatorEmail: 'teacher2@example.com', // P2 is leader
                qCount: 5,
            },
            {
                title: 'IS - Examen Regrading (P2)',
                subject: 'Ingeniería de Software',
                status: ExamStatusEnum.PUBLISHED,
                authorEmail: 'teacher2@example.com',
                validatorEmail: 'teacher2@example.com',
                qCount: 5,
            },
            // BD Exam
            {
                title: 'BD - Examen Pending',
                subject: 'Bases de Datos',
                status: ExamStatusEnum.PUBLISHED,
                authorEmail: 'teacher1@example.com',
                validatorEmail: 'teacher1@example.com',
                qCount: 5,
            },
            // Other States
            {
                title: 'IS - Borrador',
                subject: 'Ingeniería de Software',
                status: ExamStatusEnum.DRAFT,
                authorEmail: 'teacher3@example.com',
                validatorEmail: null,
                qCount: 5,
            },
            {
                title: 'BD - En Revisión',
                subject: 'Bases de Datos',
                status: ExamStatusEnum.UNDER_REVIEW,
                authorEmail: 'teacher1@example.com',
                validatorEmail: 'teacher1@example.com',
                qCount: 5,
            },
            {
                title: 'IS - Rechazado',
                subject: 'Ingeniería de Software',
                status: ExamStatusEnum.REJECTED,
                authorEmail: 'teacher3@example.com',
                validatorEmail: 'teacher2@example.com',
                qCount: 5,
            },
        ];

        const createdExamsMap = new Map<string, { exam: Exam; eqs: ExamQuestion[] }>();

        for (const eData of examsToCreate) {
            const subject = subjectMap.get(eData.subject);
            const author = teacherMap.get(eData.authorEmail);
            const validator = eData.validatorEmail ? teacherMap.get(eData.validatorEmail) : null;

            if (!subject || !author) continue;

            const exam = await Exam.create(
                {
                    title: eData.title,
                    subjectId: subject.id,
                    difficulty: DifficultyLevelEnum.MEDIUM,
                    examStatus: eData.status,
                    authorId: author.id,
                    validatorId: validator?.id || null,
                    observations:
                        eData.status === ExamStatusEnum.DRAFT
                            ? null
                            : 'Observaciones del validador',
                    questionCount: eData.qCount,
                    validatedAt: validator ? new Date() : null,
                    topicProportion: {}, // Simplified
                    topicCoverage: {}, // Simplified
                },
                { transaction: t },
            );

            const eqs = await createExamQuestions(exam.id, eData.subject, eData.qCount);
            createdExamsMap.set(eData.title, { exam, eqs });
        }

        // 5. Create Assignments
        // IS - Active
        const activeExamData = createdExamsMap.get('IS - Examen Activo (P2)');
        if (activeExamData) {
            await ExamAssignment.create(
                {
                    studentId: studentProfile.id,
                    examId: activeExamData.exam.id,
                    professorId: teacherMap.get('teacher2@example.com')!.id,
                    status: AssignedExamStatus.ENABLED, // Active
                    applicationDate: new Date('2025-08-01T00:00:00Z'),
                    durationMinutes: 100000,
                },
                { transaction: t },
            );
        }

        // IS - Grading (P3)
        const gradingExamData = createdExamsMap.get('IS - Examen Grading (P3)');
        if (gradingExamData) {
            await ExamAssignment.create(
                {
                    studentId: studentProfile.id,
                    examId: gradingExamData.exam.id,
                    professorId: teacherMap.get('teacher3@example.com')!.id,
                    status: AssignedExamStatus.GRADED, // Needs to be graded to show up? Or IN_EVALUATION?
                    // Request says "Estado: grading". In enum it might be IN_EVALUATION or similar.
                    // Checking enum... AssignedExamStatus has PENDING, ENABLED, IN_PROGRESS, SUBMITTED, IN_EVALUATION, GRADED, REGRADING, REGRADED.
                    // "grading" likely maps to IN_EVALUATION (being graded) or SUBMITTED.
                    // If the student has finished, it's SUBMITTED or IN_EVALUATION.
                    // Let's assume IN_EVALUATION for "grading".
                    applicationDate: new Date(),
                    durationMinutes: 60,
                },
                { transaction: t },
            );

            // Create Responses
            for (const eq of gradingExamData.eqs) {
                await ExamResponse.create(
                    {
                        examId: gradingExamData.exam.id,
                        examQuestionId: eq.id,
                        studentId: studentProfile.id,
                        selectedOptions: [{ text: 'Opción', isCorrect: true }], // Dummy
                        autoPoints: eq.questionScore, // Full points
                        manualPoints: null,
                        answeredAt: new Date(),
                    },
                    { transaction: t },
                );
            }
        }

        // IS - Regrading (P2)
        const regradingExamData = createdExamsMap.get('IS - Examen Regrading (P2)');
        if (regradingExamData) {
            await ExamAssignment.create(
                {
                    studentId: studentProfile.id,
                    examId: regradingExamData.exam.id,
                    professorId: teacherMap.get('teacher2@example.com')!.id,
                    status: AssignedExamStatus.REGRADING,
                    applicationDate: new Date(),
                    durationMinutes: 60,
                    grade: 80,
                },
                { transaction: t },
            );

            // Responses
            for (const eq of regradingExamData.eqs) {
                await ExamResponse.create(
                    {
                        examId: regradingExamData.exam.id,
                        examQuestionId: eq.id,
                        studentId: studentProfile.id,
                        selectedOptions: [{ text: 'Opción', isCorrect: true }],
                        autoPoints: eq.questionScore,
                        manualPoints: null,
                        answeredAt: new Date(),
                    },
                    { transaction: t },
                );
            }

            // Regrade Request
            await ExamRegrade.create(
                {
                    studentId: studentProfile.id,
                    examId: regradingExamData.exam.id,
                    professorId: teacherMap.get('teacher2@example.com')!.id,
                    reason: 'Solicito revisión de la pregunta 3, creo que mi respuesta es correcta.',
                    status: ExamRegradesStatus.IN_REVIEW,
                    requestedAt: new Date(),
                },
                { transaction: t },
            );
        }

        // BD - Pending
        const pendingExamData = createdExamsMap.get('BD - Examen Pending');
        if (pendingExamData) {
            await ExamAssignment.create(
                {
                    studentId: studentProfile.id,
                    examId: pendingExamData.exam.id,
                    professorId: teacherMap.get('teacher1@example.com')!.id,
                    status: AssignedExamStatus.PENDING,
                    applicationDate: new Date('2025-12-01T00:00:00Z'), // Future date
                    durationMinutes: 60,
                },
                { transaction: t },
            );
        }

        await t.commit();
        console.log('Seed completado exitosamente.');
        console.log('Credenciales:');
        console.log('Admin: admin@example.com / administrador123');
        console.log('Profesores: teacherX@example.com / profesor123');
        console.log('Estudiante: student@example.com / estudiante123');
    } catch (error) {
        await t.rollback();
        console.error('Error en seed:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();
