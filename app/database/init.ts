import { Sequelize } from 'sequelize';

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
  await Question.sync({ force: false });
  await QuestionSubtopic.sync({ force: false });
  await QuestionType.sync({ force: false });
  await Subject.sync({ force: false });
  await SubjectTopic.sync({ force: false });
  await Subtopic.sync({ force: false });
  await TeacherSubject.sync({ force: false });
  await Topic.sync({ force: false });
  await QuestionType.sync({ force: false });
  await Student.sync({ force: false });
  await Teacher.sync({ force: false });
  await User.sync({ force: false });
};
