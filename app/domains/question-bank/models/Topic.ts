import { Model, STRING } from 'sequelize';

import { sequelize } from '../../../database/database';

class Topic extends Model {
  public id!: string;
  public title!: string;
}

Topic.init(
  {
    id: { type: STRING, primaryKey: true },
    title: { type: STRING(200), allowNull: false, unique: true },
  },
  {
    sequelize,
    tableName: 'Topics',
  },
);

export default Topic;
