import { DataTypes, Model, STRING } from 'sequelize';

import { sequelize } from '../../../database/database';

class QuestionType extends Model {
  public id!: string;
  public name!: string; //TODO: PONER AQUI QUE SOLO ACEPTE LOS VALORES DEL ENUM
}

QuestionType.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: { type: STRING, allowNull: false, unique: true },
  },
  {
    sequelize,
    tableName: 'QuestionTypes',
    indexes: [{ unique: true, fields: ['name'] }],
  },
);

export default QuestionType;
