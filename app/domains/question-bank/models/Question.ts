import { Model, STRING, ENUM, TEXT, JSON } from "sequelize";
import { sequelize } from "../../../database/database";
import { DifficultyValues, QuestionTypeValues } from "./enums/enums";
import Teacher from "./Teacher"; 

class Question extends Model {
  public id!: string;
  public subjectId!: string;
  public topicId!: string;
  public createdBy!: string; 

  public type!: (typeof QuestionTypeValues)[number]; 
  public difficulty!: (typeof DifficultyValues)[number]; 
  public body!: string;  // Enunciado de la pregunta
  public response!: string;  // Respuesta esperada

  public options!: Array<{ text: string, isCorrect: boolean }> | null; 

  static associate() {
    Question.belongsTo(Teacher, { foreignKey: "createdBy", as: "creator" });
  }
}

Question.init(
  {
    id:         { type: STRING, primaryKey: true },
    subjectId:  { type: STRING, allowNull: false },
    topicId:    { type: STRING, allowNull: false },
    createdBy:  { type: STRING, allowNull: false, references: { model: "teachers", key: "id" } },  

    type:       { type: ENUM(...QuestionTypeValues), allowNull: false },
    difficulty: { type: ENUM(...DifficultyValues),   allowNull: false },

    body:        { type: STRING(1024), allowNull: false },
    response:    { type: TEXT, allowNull: false },  

    options: { type: JSON, allowNull: true }, 
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

