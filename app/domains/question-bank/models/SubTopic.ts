import { Model, STRING } from 'sequelize';

import Topic from './Topic';
import { sequelize } from '../../../database/database';

class Subtopic extends Model {
  public id!: string;
  public topicId!: string;
  public name!: string;
}

Subtopic.init(
  {
    id: {
      type: STRING,
      primaryKey: true,
    },
    topicId: {
      type: STRING,
      allowNull: false,
      references: { model: 'Topics', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: {
      type: STRING(200),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Subtopics',
    indexes: [{ fields: ['topicId'] }, { unique: true, fields: ['topicId', 'name'] }],
  },
);

Subtopic.belongsTo(Topic, {
  as: 'topic',
  foreignKey: 'topicId',
  targetKey: 'id',
});

export default Subtopic;
export { Subtopic };
