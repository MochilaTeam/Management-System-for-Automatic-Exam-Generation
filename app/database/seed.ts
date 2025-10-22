// app/database/seed.ts
import { sequelize } from './database';
import ExamAssignment from '../domains/exam-application/models/ExamAssignment';
import ExamResponse from '../domains/exam-application/models/ExamResponse';
import Exam from '../domains/exam-generation/models/Exam';
import ExamQuestion from '../domains/exam-generation/models/ExamQuestion';
import Question from '../domains/question-bank/models/Question';
import QuestionSubtopic from '../domains/question-bank/models/QuestionSubTopic';
import QuestionType from '../domains/question-bank/models/QuestionType';
import Subject from '../domains/question-bank/models/Subject';
import SubjectTopic from '../domains/question-bank/models/SubjectTopic';
import Subtopic from '../domains/question-bank/models/SubTopic';
import TeacherSubject from '../domains/question-bank/models/TeacherSubject';
import Topic from '../domains/question-bank/models/Topic';
import Student from '../domains/user/models/Student';
import Teacher from '../domains/user/models/Teacher';
import User from '../domains/user/models/User';

async function seed() {
    await sequelize.authenticate();
    const t = await sequelize.transaction();

    try {
        // 1) Users
        const [uCamilo] = await User.findOrCreate({
            where: { username: 'camilo.perez' },
            defaults: { passwordHash: 'hash-demo' },
            transaction: t,
        });
        const [uGuillermo] = await User.findOrCreate({
            where: { username: 'guillermo.hughes' },
            defaults: { passwordHash: 'hash-demo' },
            transaction: t,
        });
        const [uMauricio] = await User.findOrCreate({
            where: { username: 'mauricio.medina' },
            defaults: { passwordHash: 'hash-demo' },
            transaction: t,
        });
        const [uRachel] = await User.findOrCreate({
            where: { username: 'rachel.mojena' },
            defaults: { passwordHash: 'hash-demo' },
            transaction: t,
        });
        const [uJean] = await User.findOrCreate({
            where: { username: 'jean.manuel' },
            defaults: { passwordHash: 'hash-demo' },
            transaction: t,
        });

        // 2) Teachers
        const [tCamilo] = await Teacher.findOrCreate({
            where: { userId: uCamilo.id },
            defaults: {
                name: 'Camilo Perez',
                specialty: 'Bases de Datos',
                hasRoleSubjectLeader: 1,
                hasRoleExaminer: 1,
            },
            transaction: t,
        });
        const [tGuill] = await Teacher.findOrCreate({
            where: { userId: uGuillermo.id },
            defaults: {
                name: 'Guillermo Hughes',
                specialty: 'Ingeniería de SW',
                hasRoleSubjectLeader: 0,
                hasRoleExaminer: 1,
            },
            transaction: t,
        });

        // 3) Students
        const [sMauricio] = await Student.findOrCreate({
            where: { userId: uMauricio.id },
            defaults: { name: 'Mauricio Medina', age: 22, course: '3ro' },
            transaction: t,
        });
        await Student.findOrCreate({
            where: { userId: uRachel.id },
            defaults: { name: 'Rachel Mojena', age: 21, course: '3ro' },
            transaction: t,
        });
        await Student.findOrCreate({
            where: { userId: uJean.id },
            defaults: { name: 'Jean Manuel', age: 23, course: '4to' },
            transaction: t,
        });

        // 4) QuestionTypes
        const [qtMultiple] = await QuestionType.findOrCreate({
            where: { name: 'MULTIPLE' },
            transaction: t,
        });
        await QuestionType.findOrCreate({ where: { name: 'TRUE_FALSE' }, transaction: t });
        await QuestionType.findOrCreate({ where: { name: 'ESSAY' }, transaction: t });

        // 5) Topics & Subtopics
        const [topic] = await Topic.findOrCreate({
            where: { title: 'Modelado de Datos' },
            transaction: t,
        });
        const [subtopic] = await Subtopic.findOrCreate({
            where: { topicId: topic.id, name: 'Normalización' },
            transaction: t,
        });

        // 6) Subjects
        const [subject] = await Subject.findOrCreate({
            where: { name: 'Bases de Datos II' },
            defaults: { program: 'Plan 2025', leadTeacherId: tCamilo.id },
            transaction: t,
        });

        // 7) SubjectTopics (pivote explícito)
        await SubjectTopic.findOrCreate({
            where: { topicId: topic.id, subjectId: subject.id },
            defaults: {},
            transaction: t,
        });

        // 8) TeacherSubjects (pivote explícito)
        await TeacherSubject.findOrCreate({
            where: { teacherId: tCamilo.id, subjectId: subject.id },
            defaults: {},
            transaction: t,
        });
        await TeacherSubject.findOrCreate({
            where: { teacherId: tGuill.id, subjectId: subject.id },
            defaults: {},
            transaction: t,
        });

        // 9) Question
        const [question] = await Question.findOrCreate({
            where: { body: '¿Cuál es el objetivo de la 3FN (Tercera Forma Normal)?' },
            defaults: {
                authorId: tCamilo.id,
                questionTypeId: qtMultiple.id,
                subTopicId: subtopic.id,
                difficulty: 'HARD',
                options: [
                    { id: 'A', text: 'Eliminar dependencias parciales' },
                    { id: 'B', text: 'Eliminar dependencias transitivas' },
                    { id: 'C', text: 'Asegurar clave primaria compuesta' },
                    { id: 'D', text: 'Permitir redundancia controlada' },
                ] as any,
                response: null,
            },
            transaction: t,
        });

        // 9b) QuestionSubtopics (pivote explícito)
        await QuestionSubtopic.findOrCreate({
            where: { questionId: question.id, subtopicId: subtopic.id },
            defaults: {},
            transaction: t,
        });

        // 10) Exam
        const [exam] = await Exam.findOrCreate({
            where: { observations: 'Parcial 1 - BD II' },
            defaults: {
                difficulty: 'MEDIUM',
                authorId: tCamilo.id,
                validatorId: tGuill.id,
                subjectId: subject.id,
                questionCount: 1,
                topicProportion: { [topic.id]: 1 } as any,
                topicCoverage: { [subtopic.id]: 100 } as any,
                validatedAt: null,
                examStatus: 'DRAFT',
            },
            transaction: t,
        });

        // 11) ExamQuestion (pivote explícito)
        const [examQuestion] = await ExamQuestion.findOrCreate({
            where: { examId: exam.id, questionId: question.id },
            defaults: {},
            transaction: t,
        });

        // 12) ExamAssignment
        await ExamAssignment.findOrCreate({
            where: { studentId: sMauricio.id, examId: exam.id, professorId: tCamilo.id },
            defaults: {
                durationMinutes: 60,
                applicationDate: new Date(),
                status: 'PENDING', // ⬅ ENUM en MAYÚSCULA
                grade: null,
            },
            transaction: t,
        });

        // 13) ExamResponse (con examQuestionId obligatorio)
        await ExamResponse.findOrCreate({
            where: {
                studentId: sMauricio.id,
                examId: exam.id,
                examQuestionId: (examQuestion as any).id,
            },
            defaults: {
                selectedOptionId: null,
                textAnswer: 'Eliminar dependencias transitivas (3FN).',
                autoPoints: 1,
                manualPoints: null,
                answeredAt: new Date(),
            },
            transaction: t,
        });

        await t.commit();
        console.log('✅ Seed completado con éxito');
    } catch (err) {
        await t.rollback();
        console.error('❌ Seed falló:', err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();
