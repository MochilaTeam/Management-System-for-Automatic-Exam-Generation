import Question from './Question';
import QuestionSubtopic from './QuestionSubTopic';
import QuestionType from './QuestionType';
import Subject from './Subject';
import SubjectTopic from './SubjectTopic';
import Subtopic from './SubTopic';
import TeacherSubject from './TeacherSubject';
import Topic from './Topic';
import Teacher from '../../user/models/Teacher';

<<<<<<< HEAD:app/domains/question-bank/models/index.ts
Subject.belongsToMany(Topic, {
    through: SubjectTopic,
    as: 'topics',
    foreignKey: 'subjectId',
    otherKey: 'topicId',
});
Topic.belongsToMany(Subject, {
    through: SubjectTopic,
    as: 'subjects',
    foreignKey: 'topicId',
    otherKey: 'subjectId',
});

// Topic ↔ Subtopic
Topic.hasMany(Subtopic, {
    as: 'subtopics',
    foreignKey: 'topicId',
    sourceKey: 'id',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});
Subtopic.belongsTo(Topic, { as: 'topic', foreignKey: 'topicId', targetKey: 'id' });

// QuestionType ↔ Question
QuestionType.hasMany(Question, {
    as: 'questions',
    foreignKey: 'questionTypeId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});
Question.belongsTo(QuestionType, { as: 'questionType', foreignKey: 'questionTypeId' });

// Teacher ↔ Subject
Teacher.belongsToMany(Subject, {
    through: TeacherSubject,
    as: 'subjects',
    foreignKey: 'teacherId',
    otherKey: 'subjectId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});
Subject.belongsToMany(Teacher, {
    through: TeacherSubject,
    as: 'professors',
    foreignKey: 'subjectId',
    otherKey: 'professorId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});

Question.belongsToMany(Subtopic, {
    through: QuestionSubtopic,
    as: 'subtopics',
    foreignKey: 'questionId',
    otherKey: 'subtopicId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});
Subtopic.belongsToMany(Question, {
    through: QuestionSubtopic,
    as: 'questions',
    foreignKey: 'subtopicId',
    otherKey: 'questionId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});
=======
let __QB_ASSOCS_INIT__ = false;
export function initQuestionBankAssociations() {
    if (__QB_ASSOCS_INIT__) return;
    __QB_ASSOCS_INIT__ = true;

    Subject.belongsToMany(Topic, {
        through: SubjectTopic,
        as: 'topics',
        foreignKey: 'subjectId',
        otherKey: 'topicId',
    });
    Topic.belongsToMany(Subject, {
        through: SubjectTopic,
        as: 'subjects',
        foreignKey: 'topicId',
        otherKey: 'subjectId',
    });

    // Topic ↔ Subtopic
    Topic.hasMany(Subtopic, {
        as: 'subtopics',
        foreignKey: 'topicId',
        sourceKey: 'id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    Subtopic.belongsTo(Topic, { as: 'topic', foreignKey: 'topicId', targetKey: 'id' });

    // QuestionType ↔ Question
    QuestionType.hasMany(Question, {
        as: 'questions',
        foreignKey: 'questionTypeId',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
    });
    Question.belongsTo(QuestionType, { as: 'questionType', foreignKey: 'questionTypeId' });

    // Teacher ↔ Subject
    Teacher.belongsToMany(Subject, {
        through: TeacherSubject,
        as: 'subjects',
        foreignKey: 'professorId',
        otherKey: 'subjectId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    Subject.belongsToMany(Teacher, {
        through: TeacherSubject,
        as: 'professors',
        foreignKey: 'subjectId',
        otherKey: 'professorId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });

    // Question ↔ Subtopic
    Question.belongsToMany(Subtopic, {
        through: QuestionSubtopic,
        as: 'subtopics',
        foreignKey: 'questionId',
        otherKey: 'subtopicId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
    Subtopic.belongsToMany(Question, {
        through: QuestionSubtopic,
        as: 'questions',
        foreignKey: 'subtopicId',
        otherKey: 'questionId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
}

initQuestionBankAssociations();
>>>>>>> b55303efd247e53ded2a4dc2915e0abcae709034:app/domains/question-bank/models/init.ts
