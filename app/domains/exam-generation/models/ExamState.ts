import { DataTypes, Model, STRING } from 'sequelize';

import { sequelize } from '../../../database/database';

class ExamState extends Model {
  public id!: number;
  public name!: string;
}

export const initExamQuestion = () => {
  ExamState.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      }, //TODO: Fijarme por el de Camilo
      name: { type: STRING(64), allowNull: false, unique: true },
    },
    {
      sequelize,
      tableName: 'ExamStates',
      indexes: [{ unique: true, fields: ['name'] }],
    },
  );
  return ExamState;
};

export default ExamState;
