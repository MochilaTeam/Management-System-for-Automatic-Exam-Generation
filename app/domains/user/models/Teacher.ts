import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface TeacherAttributes {
  id: number;
  nombre: string;
  specialty: string;
  userId: number;
}

export type TeacherCreationAttributes = Optional<TeacherAttributes, 'id'>;

export class Teacher
  extends Model<TeacherAttributes, TeacherCreationAttributes>
  implements TeacherAttributes
{
  public id!: number;
  public nombre!: string;
  public specialty!: string;
  public userId!: number;
}

export default function defineTeacher(sequelize: Sequelize) {
  Teacher.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(200), allowNull: false },
      specialty: { type: DataTypes.STRING(200), allowNull: false },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // 1:1 con users
        references: { model: 'users', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'Teacher',
      tableName: 'Teacheres',
      timestamps: false,
      indexes: [{ unique: true, fields: ['userId'] }],
    },
  );

  return Teacher;
}
