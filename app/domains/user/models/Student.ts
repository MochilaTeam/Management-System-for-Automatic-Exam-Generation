import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface StudentAttributes {
  id: number;
  nombre: string;
  edad: number;
  curso: string;
  userId: number;
}

export type StudentCreationAttributes = Optional<StudentAttributes, 'id'>;

export class Student
  extends Model<StudentAttributes, StudentCreationAttributes>
  implements StudentAttributes
{
  public id!: number;
  public nombre!: string;
  public edad!: number;
  public curso!: string;
  public userId!: number;
}

export default function defineStudent(sequelize: Sequelize) {
  Student.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(200), allowNull: false },
      edad: { type: DataTypes.INTEGER, allowNull: false },
      curso: { type: DataTypes.STRING(100), allowNull: false },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // 1:1 con users
        references: { model: 'users', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'student',
      tableName: 'students',
      timestamps: false,
      indexes: [{ unique: true, fields: ['userId'] }],
    },
  );

  return Student;
}
