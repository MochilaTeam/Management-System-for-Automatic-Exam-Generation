import ExamAssignments from '../domains/exam-application/models/ExamAssignment';
import ExamRegrades from '../domains/exam-application/models/ExamRegrade';
import ExamResponses from '../domains/exam-application/models/ExamResponse';
import Exam from '../domains/exam-generation/models/Exam';
import ExamQuestion from '../domains/exam-generation/models/ExamQuestion';
import ExamState from '../domains/exam-generation/models/ExamState';
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

export const syncTables = async (): Promise<void> => {
  //QuestionBank
  await Question.sync({ force: false });
  await QuestionSubtopic.sync({ force: false });
  await QuestionType.sync({ force: false });
  await Subject.sync({ force: false });
  await SubjectTopic.sync({ force: false });
  await Subtopic.sync({ force: false });
  await TeacherSubject.sync({ force: false });
  await Topic.sync({ force: false });
  await QuestionType.sync({ force: false });
  //User
  await Student.sync({ force: false });
  await Teacher.sync({ force: false });
  await User.sync({ force: false });
  //ExamGeneration
  await Exam.sync({ force: false });
  await ExamQuestion.sync({ force: false });
  await ExamState.sync({ force: false });
  //ExamApplication
  await ExamAssignments.sync({ force: false });
  await ExamRegrades.sync({ force: false });
  await ExamResponses.sync({ force: false });
};
