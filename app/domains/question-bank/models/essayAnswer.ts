import { Model, STRING } from "sequelize";
import { sequelize } from "../../../database/database";

class essayAnswer extends Model {
  public questionId!: string;     // PK = FK → Question.id
  public expectedAnswer!: string; 
}

essayAnswer.init(
  {
    questionId: {
      type: STRING,
      primaryKey: true,
      references: { model: "questions", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    expectedAnswer: { type: STRING(4000), allowNull: false },
  },
  { sequelize, tableName: "essay_expected" }
);

export default essayAnswer;
