import { Model, STRING } from "sequelize";
import { sequelize } from "../../../database/database";
import Topic from "./Topic";
import SubjectTopic from "./SubjectTopic";

class Subject extends Model {
  public id!: string;
  public name!: string;
}

Subject.init(
  {
    id: { type: STRING, primaryKey: true },
    name: { type: STRING(200), allowNull: false, unique: true },
    program: { type: STRING(200), allowNull: false },
  },
  { sequelize, tableName: "Subjects" }

  
);

Subject.belongsToMany(Topic, {
  through: SubjectTopic,
  as: "topics",
  foreignKey: "subjectId",
  otherKey: "topicId",
});


export default Subject;
