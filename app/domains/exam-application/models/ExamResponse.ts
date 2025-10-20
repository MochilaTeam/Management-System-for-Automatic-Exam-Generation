import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../../../database/database';

class ExamResponses extends Model {
  public id!: string;
  public studentId!: string;
  public examId!: string;
  public questionId!: string;
  public selectedOptionId!: string | null;
  public textAnswer!: string | null;
  public autoPoints!: number;
  public manualPoints!: number | null;
  public answeredAt!: Date | null;
}

ExamResponses.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    studentId: { type: DataTypes.UUID, allowNull: false },
    examId: { type: DataTypes.UUID, allowNull: false },
    questionId: { type: DataTypes.UUID, allowNull: false },
    selectedOptionId: { type: DataTypes.UUID, allowNull: true },
    textAnswer: { type: DataTypes.TEXT, allowNull: true },
    autoPoints: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    manualPoints: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    answeredAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'ExamResponses',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['studentId', 'examId', 'questionId'] }, // agregación ternaria
      { fields: ['examId'] },
      { fields: ['studentId'] },
      { fields: ['questionId'] },
    ],
  },
);

export default ExamResponses;
