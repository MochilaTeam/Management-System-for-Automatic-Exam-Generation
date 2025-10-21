import { Model, STRING, INTEGER } from 'sequelize';

import { sequelize } from '../../../database/database';

class Teacher extends Model {
  public id!: number;
  public name!: string;
  public specialty!: string;
  public userId!: number;
}

Teacher.init(
  {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: STRING(200), allowNull: false },
    specialty: { type: STRING(200), allowNull: false },
    userId: {
      type: INTEGER,
      allowNull: false,
      unique: true, // one user ↔ one teacher
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
