import ExamAssignments from "../infrastructure/exam-application/models/ExamAssignment";
import ExamRegrades from "../infrastructure/exam-application/models/ExamRegrade";
import ExamResponses from "../infrastructure/exam-application/models/ExamResponse";
import Exam from "../infrastructure/exam-generation/models/Exam";
import ExamQuestion from "../infrastructure/exam-generation/models/ExamQuestion";
import Question from "../infrastructure/question-bank/models/Question";
import QuestionSubtopic from "../infrastructure/question-bank/models/QuestionSubTopic";
import QuestionType from "../infrastructure/question-bank/models/QuestionType";
import Subject from "../infrastructure/question-bank/models/Subject";
import SubjectTopic from "../infrastructure/question-bank/models/SubjectTopic";
import Subtopic from "../infrastructure/question-bank/models/SubTopic";
import TeacherSubject from "../infrastructure/question-bank/models/TeacherSubject";
import Topic from "../infrastructure/question-bank/models/Topic";
import Student from "../infrastructure/user/models/Student";
import Teacher from "../infrastructure/user/models/Teacher";
import User from "../infrastructure/user/models/User";

let _models: any | null = null;
export function getModels() {
  if (_models) return _models;
  _models = {
    // exam-application
    ExamAssignments, ExamRegrades, ExamResponses,
    // exam-generation
    Exam, ExamQuestion,
    // question-bank
    Question, QuestionSubtopic, QuestionType, Subject, SubjectTopic,
    Subtopic, TeacherSubject, Topic,
    // user
    Student, Teacher, User,
  };
  return _models;
}
