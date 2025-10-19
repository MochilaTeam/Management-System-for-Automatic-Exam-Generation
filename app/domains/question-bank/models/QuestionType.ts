import { Model, STRING, TEXT, JSON } from "sequelize";
import { sequelize } from "../../../database/database";

class QuestionType extends Model {
  public id!: string;
  public name!: string;
}

QuestionType.init(
  {
    id:       { type: STRING, primaryKey: true },
    name:     { type: STRING, allowNull: false, unique: true },
  },
  {
    sequelize,
    tableName: "QuestionTypes",
    indexes: [{ unique: true, fields: ["name"] }],
  }
);

export default QuestionType;
