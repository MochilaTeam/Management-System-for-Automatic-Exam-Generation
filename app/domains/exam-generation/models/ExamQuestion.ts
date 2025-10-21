import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../../../database/database';

class ExamQuestion extends Model {
  public id!: string;
  public examId!: string;
  public questionId!: string;
}
ExamQuestion.init(
  {
    examId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: { model: 'Exams', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    questionId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      references: { model: 'Questions', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
  },
  {
    sequelize,
    tableName: 'ExamQuestions',
    indexes: [
      { unique: true, fields: ['examId', 'questionId'] },
      { fields: ['examId'] },
      { fields: ['questionId'] },
    ],
  },
);

export default ExamQuestion;
