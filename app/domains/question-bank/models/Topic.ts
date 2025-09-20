// src/models/Task.ts
import { Model, STRING } from "sequelize";
import { sequelize } from "../../../database/database";

class Topic extends Model {
  public id!: string;
  public title!: string;
  public parentTopicId!: string | null; 
}

Topic.init(
  {
    id: { type: STRING, primaryKey: true },
    title: { type: STRING(200), allowNull: false },
    parentTopicId: {
      type: STRING,
      allowNull: true,
      references: { model: "Topic", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
  },
  {
    sequelize,
    tableName: "Topics",
    indexes: [
      { fields: ["parentTopicId"] }, 
      { unique: true, fields: ["parentTopicId", "title"] },
    ],
  }
);

Topic.belongsTo(Topic, { as: "parentTopic", foreignKey: "parentTopicId" });
Topic.hasMany(Topic,   { as: "subTopics",   foreignKey: "parentTopicId" });

export default Topic;
