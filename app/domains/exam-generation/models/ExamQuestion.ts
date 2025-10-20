import { DataTypes, INTEGER, Model } from 'sequelize';

import { sequelize } from '../../../database/database';

class ExamQuestion extends Model {
  public id!: number;
  public examId!: number;
  public questionId!: number;
}
export const initExamQuestion = () => {
  ExamQuestion.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      }, //TODO: Fijarme por lo de Camilo

      examId: {
        type: INTEGER,
        allowNull: false,
        references: { model: 'Exams', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },

      questionId: {
        type: INTEGER,
        allowNull: false,
        references: { model: 'Questions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
  return ExamQuestion
}

export default ExamQuestion;
