import Exam from './Exam';
import ExamQuestion from './ExamQuestion';
import Question from '../../question-bank/models/Question';
import Teacher from '../../user/models/Teacher';
import Subject from '../../question-bank/models/Subject';

Teacher.hasMany(Exam, {
    foreignKey: { name: 'authorId', allowNull: false },
    as: 'exams',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
});

Exam.belongsTo(Teacher, {
    foreignKey: { name: 'authorId', allowNull: false },
    as: 'author',
});

Teacher.hasMany(Exam, {
    foreignKey: { name: 'validatorId', allowNull: true },
    as: 'validatedExams',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
});

Exam.belongsTo(Teacher, {
    foreignKey: 'validatorId',
    as: 'validator',
});

Exam.belongsToMany(Question, {
    through: ExamQuestion,
    as: 'questions',
    foreignKey: 'examId',
    otherKey: 'questionId',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
});

Question.belongsToMany(Exam, {
    through: ExamQuestion,
    as: 'exams',
    foreignKey: 'questionId',
    otherKey: 'examId',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
});

Subject.hasMany(Exam, {
  foreignKey: {name: 'subjectId', allowNull: false},
  as: 'exams',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Exam.belongsTo(Subject, {
  foreignKey: 'subjectId',
  as: 'subject',
});
