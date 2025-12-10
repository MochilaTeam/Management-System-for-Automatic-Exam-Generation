import type { Model } from 'sequelize';
import '../infrastructure/exam-application/models';
import '../infrastructure/exam-generation/models';
import '../infrastructure/question-bank/models';
import '../infrastructure/user/models';

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
import { Student, Teacher, User } from '../infrastructure/user/models';

const syncModel = async (model: {
    sync: (options: { alter: boolean }) => Promise<Model<any, any>>;
}) => {
    try {
        await model.sync({ alter: true });
    } catch (error) {
        const errno = (error as { original?: { errno?: number } }).original?.errno;
        if (errno === 1069) {
            return;
        }
        throw error;
    }
};

export const syncTables = async (): Promise<void> => {
    //QuestionBank
    await syncModel(Question);
    await syncModel(QuestionSubtopic);
    await syncModel(QuestionType);
    await syncModel(Subject);
    await syncModel(SubjectTopic);
    await syncModel(Subtopic);
    await syncModel(TeacherSubject);
    await syncModel(Topic);
    await syncModel(QuestionType);
    //User
    await syncModel(Student);
    await syncModel(Teacher);
    await syncModel(User);
    //ExamGeneration
    await syncModel(Exam);
    await syncModel(ExamQuestion);
    //ExamApplication
    await syncModel(ExamAssignments);
    await syncModel(ExamRegrades);
    await syncModel(ExamResponses);
};
