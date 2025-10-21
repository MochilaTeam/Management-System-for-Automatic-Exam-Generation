import { Model, STRING, DataTypes } from 'sequelize';

import { sequelize } from '../../../database/database';

class Teacher extends Model {
  public id!: string;
  public name!: string;
  public specialty!: string;
  public userId!: string;
}

Teacher.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: { type: STRING(200), allowNull: false },
    specialty: { type: STRING(200), allowNull: false },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: 'Users', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'Teachers',
    timestamps: false,
    indexes: [{ unique: true, fields: ['userId'] }],
  },
);

export default Teacher;
