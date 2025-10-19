import { Model, STRING } from "sequelize";
import { sequelize } from "../../../database/database";
import Subtopic from "./SubTopic";
import Subject from "./Subject";
import SubjectTopic from "./SubjectTopic";

class Topic extends Model {
  public id!: string;        
  public title!: string;    
}

Topic.init(
  {
    id:    { type: STRING, primaryKey: true },
    title: { type: STRING(200), allowNull: false, unique: true },
  },
  {
    sequelize,
    tableName: "Topics", 
  }
);

Topic.hasMany(Subtopic, {
  as: "subtopics",
  foreignKey: "topicId",
  sourceKey: "id",
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});

Topic.belongsToMany(Subject, {
  through: SubjectTopic,
  as: "subjects",
  foreignKey: "topicId",
  otherKey: "subjectId",
});

export default Topic;
export { Topic };
