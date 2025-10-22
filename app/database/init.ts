    import ExamAssignments from '../domains/exam-application/models/ExamAssignment';
    import ExamRegrades from '../domains/exam-application/models/ExamRegrade';
    import ExamResponses from '../domains/exam-application/models/ExamResponse';
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
