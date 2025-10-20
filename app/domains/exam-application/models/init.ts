import ExamAssignment from './ExamAssignment';
import ExamRegrade from './ExamRegrade';
import ExamResponse from './ExamResponse';
import Exam from '../../examG/models/Exam';
import Question from '../../question-bank/models/Question';
import Student from '../../user/models/Student';
import Teacher from '../../user/models/Teacher';

let __EXAM_ASSOCS_INIT__ = false;

export function initExamAssociations() {
  if (__EXAM_ASSOCS_INIT__) return;
  __EXAM_ASSOCS_INIT__ = true;

  // ExamAssignment (Student–Exam–Teacher) ==========
  ExamAssignment.belongsTo(Student, {
    as: 'student',
    foreignKey: { name: 'studentId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  ExamAssignment.belongsTo(Exam, {
    as: 'exam',
    foreignKey: { name: 'examId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  ExamAssignment.belongsTo(Teacher, {
    as: 'professor',
    foreignKey: { name: 'professorId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  Student.hasMany(ExamAssignment, {
    as: 'examAssignments',
    foreignKey: { name: 'studentId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Exam.hasMany(ExamAssignment, {
    as: 'assignments',
    foreignKey: { name: 'examId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Teacher.hasMany(ExamAssignment, {
    as: 'givenAssignments',
    foreignKey: { name: 'professorId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  // ExamResponse (Student–Exam–Question) ==========
  ExamResponse.belongsTo(Student, {
    as: 'student',
    foreignKey: { name: 'studentId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  ExamResponse.belongsTo(Exam, {
    as: 'exam',
    foreignKey: { name: 'examId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  ExamResponse.belongsTo(Question, {
    as: 'question',
    foreignKey: { name: 'questionId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  Student.hasMany(ExamResponse, {
    as: 'examResponses',
    foreignKey: { name: 'studentId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Exam.hasMany(ExamResponse, {
    as: 'responses',
    foreignKey: { name: 'examId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Question.hasMany(ExamResponse, {
    as: 'responses',
    foreignKey: { name: 'questionId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  //ExamRegrade (Student–Exam–Teacher) ==========
  ExamRegrade.belongsTo(Student, {
    as: 'student',
    foreignKey: { name: 'studentId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  ExamRegrade.belongsTo(Exam, {
    as: 'exam',
    foreignKey: { name: 'examId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  ExamRegrade.belongsTo(Teacher, {
    as: 'reviewer',
    foreignKey: { name: 'professorId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });

  Student.hasMany(ExamRegrade, {
    as: 'regrades',
    foreignKey: { name: 'studentId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Exam.hasMany(ExamRegrade, {
    as: 'regrades',
    foreignKey: { name: 'examId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Teacher.hasMany(ExamRegrade, {
    as: 'assignedRegrades',
    foreignKey: { name: 'professorId', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
}

initExamAssociations();
