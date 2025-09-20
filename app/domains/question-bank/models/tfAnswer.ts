import { Model, STRING, BOOLEAN, INTEGER } from "sequelize";
import { sequelize } from "../../../database/database";

class tfAnswer extends Model {
  public id!: string;
  public questionId!: string;  
  public statement!: string;  
  public correctAnswer!: boolean;
  public order!: number | null;
}

tfAnswer.init(
  {
    id:            { type: STRING, primaryKey: true },
    questionId:    { type: STRING, allowNull: false },
    statement:     { type: STRING(1000), allowNull: false },
    correctAnswer: { type: BOOLEAN, allowNull: false },
    order:         { type: INTEGER, allowNull: true },
  },
  {
    sequelize,
    tableName: "true_false_items",
    indexes: [{ fields: ["questionId", "order"] }],
  }
);

export default tfAnswer;
