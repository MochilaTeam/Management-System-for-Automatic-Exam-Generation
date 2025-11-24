import { sequelize } from './database';
import { getHasher } from '../core/security/hasher';
import { QuestionTypeEnum } from '../domains/question-bank/entities/enums/QuestionType';
import {
    Subject,
    Topic,
    SubTopic as Subtopic,
    SubjectTopic,
} from '../infrastructure/question-bank/models';
import QuestionType from '../infrastructure/question-bank/models/QuestionType';
import TeacherSubject from '../infrastructure/question-bank/models/TeacherSubject';
import { User, Teacher } from '../infrastructure/user/models';
import { Roles } from '../shared/enums/rolesEnum';

async function seed() {
    await sequelize.authenticate();
    const t = await sequelize.transaction();

    try {
        const hasher = getHasher();
        const adminPasswordHash = await hasher.hash('123456789C');

        // Admin user
        await User.findOrCreate({
            where: { email: 'admin@gmail.com' },
            defaults: {
                name: 'admin',
                email: 'admin@gmail.com',
                passwordHash: adminPasswordHash,
                role: Roles.ADMIN,
            },
            transaction: t,
        });

        // Teacher user + profile
        const teacherEmail = 'teacher1@example.com';
        const teacherPasswordHash = await hasher.hash('profesor123');

        const [teacherUser] = await User.findOrCreate({
            where: { email: teacherEmail },
            defaults: {
                name: 'Teacher One',
                email: teacherEmail,
                passwordHash: teacherPasswordHash,
                role: Roles.TEACHER,
            },
            transaction: t,
        });

        const [teacherProfile] = await Teacher.findOrCreate({
            where: { userId: teacherUser.id },
            defaults: {
                userId: teacherUser.id,
                specialty: 'Bases de datos',
                hasRoleSubjectLeader: true,
                hasRoleExaminer: true,
            },
            transaction: t,
        });

        // Subject
        const [subject] = await Subject.findOrCreate({
            where: { name: 'Bases de Datos I' },
            defaults: {
                name: 'Bases de Datos I',
                program: 'Programa de BD I',
                leadTeacherId: teacherProfile.id,
            },
            transaction: t,
        });

        // Asegurar que el líder sea el teacher del seed
        if (!subject.getDataValue('leadTeacherId')) {
            subject.set('leadTeacherId', teacherProfile.id);
            await subject.save({ transaction: t });
        }

        // Relación Teacher ↔ Subject
        await TeacherSubject.findOrCreate({
            where: { teacherId: teacherProfile.id, subjectId: subject.id },
            defaults: { teacherId: teacherProfile.id, subjectId: subject.id },
            transaction: t,
        });

        // Topic
        const [topic] = await Topic.findOrCreate({
            where: { title: 'Modelo relacional' },
            defaults: { title: 'Modelo relacional' },
            transaction: t,
        });

        // SubjectTopic
        await SubjectTopic.findOrCreate({
            where: { subjectId: subject.id, topicId: topic.id },
            defaults: { subjectId: subject.id, topicId: topic.id },
            transaction: t,
        });

        // Subtopic
        const [subtopic] = await Subtopic.findOrCreate({
            where: { topicId: topic.id, name: 'Llaves primarias' },
            defaults: { topicId: topic.id, name: 'Llaves primarias' },
            transaction: t,
        });

        // Question types (MCQ, TRUE_FALSE, ESSAY)
        for (const name of Object.values(QuestionTypeEnum)) {
            await QuestionType.findOrCreate({
                where: { name },
                defaults: { name },
                transaction: t,
            });
        }

        await t.commit();
        console.log('Seed completado con éxito.');
        console.log('Usuario admin -> email: admin@gmail.com | password: 123456789C');
        console.log('Usuario profesor -> email: teacher1@example.com | password: profesor123');
        console.log(`Subject "Bases de Datos I" id: ${subject.id}`);
        console.log(`Topic "Modelo relacional" id: ${topic.id}`);
        console.log(`Subtopic "Llaves primarias" id: ${subtopic.id}`);
    } catch (err) {
        await t.rollback();
        console.error('Seed falló:', err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();
