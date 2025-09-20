import { Model, STRING, BOOLEAN, INTEGER } from "sequelize";
import { sequelize } from "../../../database/database";

class mcqAnswer extends Model {
  public id!: string;
  public questionId!: string;   // FK → Question.id
  public text!: string;
  public isCorrect!: boolean;
  public order!: number | null;
}

mcqAnswer.init(
  {
    id:         { type: STRING, primaryKey: true },
    questionId: { type: STRING, allowNull: false },
    text:       { type: STRING(1000), allowNull: false },
    isCorrect:  { type: BOOLEAN, allowNull: false, defaultValue: false },
    order:      { type: INTEGER, allowNull: true },
  },
  {
    sequelize,
    tableName: "question_options",
    indexes: [{ fields: ["questionId", "order"] }],
  }
);

export default mcqAnswer;
