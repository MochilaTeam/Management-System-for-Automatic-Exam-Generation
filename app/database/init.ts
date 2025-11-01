import ExamAssignments from '../infrastructure/exam-application/models/ExamAssignment';
import ExamRegrades from '../infrastructure/exam-application/models/ExamRegrade';
import ExamResponses from '../infrastructure/exam-application/models/ExamResponse';
import Exam from '../infrastructure/exam-generation/models/Exam';
import ExamQuestion from '../infrastructure/exam-generation/models/ExamQuestion';
import Question from '../infrastructure/question-bank/models/Question';
import QuestionSubtopic from '../infrastructure/question-bank/models/QuestionSubTopic';
import QuestionType from '../infrastructure/question-bank/models/QuestionType';
import Subject from '../infrastructure/question-bank/models/Subject';
import SubjectTopic from '../infrastructure/question-bank/models/SubjectTopic';
import Subtopic from '../infrastructure/question-bank/models/SubTopic';
import TeacherSubject from '../infrastructure/question-bank/models/TeacherSubject';
import Topic from '../infrastructure/question-bank/models/Topic';
import Student from '../infrastructure/user/models/Student';
import Teacher from '../infrastructure/user/models/Teacher';
import User from '../infrastructure/user/models/User';

export const syncTables = async (): Promise<void> => {
    //QuestionBank
    await Question.sync({ alter: true });
    await QuestionSubtopic.sync({ alter: true });
    await QuestionType.sync({ alter: true });
    await Subject.sync({ alter: true });
    await SubjectTopic.sync({ alter: true });
    await Subtopic.sync({ alter: true });
    await TeacherSubject.sync({ alter: true });
    await Topic.sync({ alter: true });
    await QuestionType.sync({ alter: true });
    //User
    await Student.sync({ alter: true });
    await Teacher.sync({ alter: true });
    await User.sync({ alter: true });
    //ExamGeneration
    await Exam.sync({ alter: true });
    await ExamQuestion.sync({ alter: true });
    //ExamApplication
    await ExamAssignments.sync({ alter: true });
    await ExamRegrades.sync({ alter: true });
    await ExamResponses.sync({ alter: true });
};
