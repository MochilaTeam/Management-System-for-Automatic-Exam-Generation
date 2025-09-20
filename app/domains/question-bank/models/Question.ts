import { Model, STRING, ENUM } from "sequelize";
import { sequelize } from "../../../database/database";
import { DifficultyValues, QuestionTypeValues } from "./enums/enums";

class Question extends Model {
  public id!: string;
  public subjectId!: string;
  public topicId!: string;
  public createdBy!: string;

  public type!: (typeof QuestionTypeValues)[number];
  public difficulty!: (typeof DifficultyValues)[number];

  public body!: string;  
}

Question.init(
  {
    id:         { type: STRING, primaryKey: true },
    subjectId:  { type: STRING, allowNull: false },
    topicId:    { type: STRING, allowNull: false },
    createdBy:  { type: STRING, allowNull: false },

    type:       { type: ENUM(...QuestionTypeValues), allowNull: false },
    difficulty: { type: ENUM(...DifficultyValues),   allowNull: false },

    body:        { type: STRING(1024), allowNull: false },
  },
  {
    sequelize,
    tableName: "questions",
    indexes: [
      { fields: ["subjectId", "topicId", "type", "difficulty"] },
      { unique: true, fields: ["subjectId", "body"] },
    ],
  }
);

export default Question;

