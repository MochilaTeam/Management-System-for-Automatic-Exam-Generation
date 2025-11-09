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

type SequelizeModels = {
    // exam-application
    ExamAssignments: typeof ExamAssignments;
    ExamRegrades: typeof ExamRegrades;
    ExamResponses: typeof ExamResponses;

    // exam-generation
    Exam: typeof Exam;
    ExamQuestion: typeof ExamQuestion;

    // question-bank
    Question: typeof Question;
    QuestionSubtopic: typeof QuestionSubtopic;
    QuestionType: typeof QuestionType;
    Subject: typeof Subject;
    SubjectTopic: typeof SubjectTopic;
    Subtopic: typeof Subtopic;
    TeacherSubject: typeof TeacherSubject;
    Topic: typeof Topic;

    // user
    Student: typeof Student;
    Teacher: typeof Teacher;
    User: typeof User;
};

type UserModelsSubset = Pick<SequelizeModels, 'User' | 'Teacher' | 'Student'>;

let _models: SequelizeModels | null = null;
let _userModels: UserModelsSubset | null = null;

export function getModels(): SequelizeModels {
    if (_models) return _models;
    _models = {
        // exam-application
        ExamAssignments,
        ExamRegrades,
        ExamResponses,
        // exam-generation
        Exam,
        ExamQuestion,
        // question-bank
        Question,
        QuestionSubtopic,
        QuestionType,
        Subject,
        SubjectTopic,
        Subtopic,
        TeacherSubject,
        Topic,
        // user
        Student,
        Teacher,
        User,
    };
    return _models;
}
export function getUserModels(): UserModelsSubset {
    if (_userModels) return _userModels;
    const m = getModels();
    _userModels = { User: m.User, Teacher: m.Teacher, Student: m.Student };
    return _userModels;
}
