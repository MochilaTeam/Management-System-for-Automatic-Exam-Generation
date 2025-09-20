import { Model, STRING } from "sequelize";
import { sequelize } from "../../../database/database";
import Question from "./Question";

class Subject extends Model {
  public id!: string;
  public name!: string;
}

Subject.init(
  {
    id: { type: STRING, primaryKey: true },
    name: { type: STRING(200), allowNull: false, unique: true },
  },
  { sequelize, tableName: "subjects" }
);

Subject.hasMany(Question, { foreignKey: "subjectId", as: "questions" });

export default Subject;
