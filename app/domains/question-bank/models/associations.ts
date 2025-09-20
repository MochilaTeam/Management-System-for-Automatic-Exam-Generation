import Question from "./Question";
import QuestionOption from "././mcqAnswer";
import TrueFalseItem from "././tfAnswer";
import EssayExpected from "././essayAnswer";

Question.hasMany(QuestionOption, { as: "options", foreignKey: "questionId", onDelete: "CASCADE", onUpdate: "CASCADE" });
QuestionOption.belongsTo(Question, { as: "question", foreignKey: "questionId" });

Question.hasMany(TrueFalseItem, { as: "tfItems", foreignKey: "questionId", onDelete: "CASCADE", onUpdate: "CASCADE" });
TrueFalseItem.belongsTo(Question, { as: "question", foreignKey: "questionId" });

Question.hasOne(EssayExpected, { as: "essay", foreignKey: "questionId" });
EssayExpected.belongsTo(Question, { as: "question", foreignKey: "questionId" });
