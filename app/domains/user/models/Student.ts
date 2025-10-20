import { Model, STRING, INTEGER } from 'sequelize';
import { sequelize } from '../../../database/database';
import User from './User';

class Student extends Model {
  public id!: number;
  public name!: string;
  public age!: number;
  public course!: string;
  public userId!: number;
}

Student.init(
  {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: STRING(200), allowNull: false },
    age: { type: INTEGER, allowNull: false },
    course: { type: STRING(100), allowNull: false },
    userId: {
      type: INTEGER,
      allowNull: false,
      unique: true, // one user ↔ one student
      references: { model: 'Users', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'Students',
    timestamps: false,
    indexes: [{ unique: true, fields: ['userId'] }],
  }
);

// Associations
Student.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export default Student;
