import { Model, STRING, INTEGER } from 'sequelize';

import { sequelize } from '../../../database/database';

class User extends Model {
  public id!: number;
  public username!: string;
  public passwordHash!: string;
}

User.init(
  {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    username: {
      type: STRING(100),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'Users',
    timestamps: false,
    indexes: [{ unique: true, fields: ['username'] }],
  },
);

export default User;
