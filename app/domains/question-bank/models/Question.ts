import { Model, STRING, ENUM, TEXT, JSON } from "sequelize";
import { sequelize } from "../../../database/database";
import { DifficultyValues, QuestionTypeValues } from "./enums/enums";
import QuestionType from "./QuestionType";
import Subtopic from "./SubTopic";
import QuestionSubtopic from "./QuestionSubTopic";

class Question extends Model {
  public id!: string;
  public subjectId!: string;
  public createdBy!: string;

  public type!: (typeof QuestionTypeValues)[number];
  public difficulty!: (typeof DifficultyValues)[number];
  public body!: string;

  public questionTypeId!: string;

}

Question.init(
  {
    id:          { type: STRING, primaryKey: true },
    subjectId:   { type: STRING, allowNull: false },
    createdBy:   { type: STRING, allowNull: false, references: { model: "teachers", key: "id" } },

    difficulty:  { type: ENUM(...DifficultyValues),   allowNull: false },

    body:        { type: STRING(1024), allowNull: false },

    questionTypeId: {
      type: STRING,
      allowNull: false,
      references: { model: "QuestionTypes", key: "id" },
    },
  },
  {
    sequelize,
    tableName: "Questions",
    indexes: [
      { fields: ["subjectId", "topicId", "difficulty"] },
      { unique: true, fields: ["subjectId", "body"] },
      { fields: ["questionTypeId"] },
    ],
  }
);

QuestionType.hasMany(Question, {
  foreignKey: "questionTypeId",
  as: "questions",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Question.belongsTo(QuestionType, {
  foreignKey: "questionTypeId",
  as: "questionType",
});

Question.belongsToMany(Subtopic, {
  through: QuestionSubtopic,
  as: "subtopics",
  foreignKey: "questionId",
  otherKey: "subtopicId",
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});

Subtopic.belongsToMany(Question, {
  through: QuestionSubtopic,
  as: "questions",
  foreignKey: "subtopicId",
  otherKey: "questionId",
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});

export default Question;

