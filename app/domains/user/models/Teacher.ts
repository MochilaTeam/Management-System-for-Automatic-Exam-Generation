import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface ProfesorAttributes {
  id: number;
  nombre: string;
  especialidad: string;
  userId: number;
}

export type ProfesorCreationAttributes = Optional<ProfesorAttributes, 'id'>;

export class Profesor
  extends Model<ProfesorAttributes, ProfesorCreationAttributes>
  implements ProfesorAttributes
{
  public id!: number;
  public nombre!: string;
  public especialidad!: string;
  public userId!: number;
}

export default function defineProfesor(sequelize: Sequelize) {
  Profesor.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(200), allowNull: false },
      especialidad: { type: DataTypes.STRING(200), allowNull: false },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // 1:1 con users
        references: { model: 'users', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'Profesor',
      tableName: 'profesores',
      timestamps: false,
      indexes: [{ unique: true, fields: ['userId'] }],
    },
  );

  return Profesor;
}
