import { Model, STRING, TEXT, JSON } from "sequelize";
import { sequelize } from "../../../database/database";

class QuestionType extends Model {
  public id!: string;
  public name!: string;

  public options!: Array<{ text: string; isCorrect: boolean }> | null;
  public response!: string;
}

QuestionType.init(
  {
    id:       { type: STRING, primaryKey: true },
    name:     { type: STRING, allowNull: false, unique: true },
    options:  { type: JSON, allowNull: true },            // <-- Array<{text,isCorrect}>  (mcq)
    response: { type: TEXT, allowNull: false },           // <-- (essay)
  },
  {
    sequelize,
    tableName: "QuestionTypes",
    indexes: [{ unique: true, fields: ["name"] }],
  }
);

export default QuestionType;
