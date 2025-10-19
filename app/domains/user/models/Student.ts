import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface EstudianteAttributes {
  id: number;
  nombre: string;
  edad: number;
  curso: string;
  userId: number;
}

export type EstudianteCreationAttributes = Optional<EstudianteAttributes, 'id'>;

export class Estudiante extends Model<EstudianteAttributes, EstudianteCreationAttributes>
  implements EstudianteAttributes {
  public id!: number;
  public nombre!: string;
  public edad!: number;
  public curso!: string;
  public userId!: number;
}

export default function defineEstudiante(sequelize: Sequelize) {
  Estudiante.init(
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
      modelName: 'Estudiante',
      tableName: 'estudiantes',
      timestamps: false,
      indexes: [{ unique: true, fields: ['userId'] }],
    }
  );

  return Estudiante;
}
