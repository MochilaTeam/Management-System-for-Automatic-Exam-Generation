import { Model, STRING, ENUM, INTEGER, JSON, TEXT } from "sequelize";
import { sequelize } from "../../../database/database";
import { DifficultyValues, QuestionTypeValues } from "./enums/enums";
import QuestionType from "./QuestionType";

import Subtopic from "./SubTopic";
import QuestionSubtopic from "./QuestionSubTopic";

import { Profesor } from "../../user/models/Teacher";

class Question extends Model {
  public id!: string;
  public subjectId!: string;

  public professorId!: number;
  public difficulty!: (typeof DifficultyValues)[number];
  public body!: string;

  public questionTypeId!: string;

  public options!: Array<{ text: string; isCorrect: boolean }> | null;
  public response!: string;
}

Question.init(
  {
    id:          { type: STRING, primaryKey: true },
    subjectId:   { type: STRING, allowNull: false },

    options:  { type: JSON, allowNull: true },            // <-- Array<{text,isCorrect}>  (mcq)
    response: { type: TEXT, allowNull: false },           // <-- (essay)
      

    professorId: {
      type: INTEGER,
      allowNull: false,
      references: { model: "profesores", key: "id" }, 
      onUpdate: "CASCADE",
      onDelete: "RESTRICT", 
    },

    difficulty:  { type: ENUM(...DifficultyValues), allowNull: false },
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
      { fields: ["subjectId", "difficulty", "options", "response"] },
      { unique: true, fields: ["subjectId", "body"] },
      { fields: ["questionTypeId"] },
      { fields: ["professorId"] },
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

Profesor.hasMany(Question, {
  foreignKey: "professorId",
  as: "questions",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Question.belongsTo(Profesor, {
  foreignKey: "professorId",
  as: "professor",
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
