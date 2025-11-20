import Question from './Question';
import QuestionSubtopic from './QuestionSubTopic';
import QuestionType from './QuestionType';
import Subject from './Subject';
import SubjectTopic from './SubjectTopic';
import Subtopic from './SubTopic';
import TeacherSubject from './TeacherSubject';
import Topic from './Topic';
import { Teacher } from '../../user/models';

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
    as: 'teachers',
    foreignKey: 'subjectId',
    otherKey: 'teacherId',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});
Subject.belongsTo(Teacher, {
    foreignKey: 'leadTeacherId',
    as: 'leadTeacher',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
});
Teacher.hasMany(Subject, {
    foreignKey: 'leadTeacherId',
    as: 'leadSubjects',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
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
Question.belongsTo(Subtopic, {
    as: 'primarySubtopic',
    foreignKey: 'subTopicId',
    targetKey: 'id',
});
Subtopic.hasMany(Question, {
    as: 'primaryQuestions',
    foreignKey: 'subTopicId',
    sourceKey: 'id',
});
export { default as Subject } from './Subject';
export { default as Topic } from './Topic';
export { default as SubTopic } from './SubTopic';
export { default as SubjectTopic } from './SubjectTopic';
