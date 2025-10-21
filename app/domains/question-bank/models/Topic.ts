import { DataTypes, Model, STRING } from 'sequelize';

import { sequelize } from '../../../database/database';

class Topic extends Model {
  public id!: string;
  public title!: string;
}

Topic.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: { type: STRING(200), allowNull: false, unique: true },
  },
  {
    sequelize,
    tableName: 'Topics',
  },
);

export default Topic;
