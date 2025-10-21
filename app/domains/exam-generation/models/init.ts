import Exam from './Exam';
import ExamQuestion from './ExamQuestion';
import ExamState from './ExamState';
import Question from '../../question-bank/models/Question';
import Teacher from '../../user/models/Teacher';

ExamState.hasMany(Exam, {
    foreignKey: 'examStateId',
    as: 'exams',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});

Exam.belongsTo(ExamState, {
    foreignKey: 'examStateId',
    as: 'state',
});

Teacher.hasMany(Exam, {
    foreignKey: 'authorId',
    as: 'exams',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});

Exam.belongsTo(Teacher, {
    foreignKey: 'authorId',
    as: 'author',
});

Teacher.hasMany(Exam, {
    foreignKey: 'validatorId',
    as: 'validatedExams',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});

Exam.belongsTo(Teacher, {
    //TODO: Cambiar a teacher
    foreignKey: 'validatorId',
    as: 'validator',
});

Exam.belongsToMany(Question, {
    through: ExamQuestion,
    as: 'questions',
    foreignKey: 'examId',
    otherKey: 'questionId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
});

Question.belongsToMany(Exam, {
    through: ExamQuestion,
    as: 'exams',
    foreignKey: 'questionId',
    otherKey: 'examId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
});
