import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../../../database/database';

class ExamAssignments extends Model {
      public id!: string;
      public studentId!: string;
      public examId!: string;
      public professorId!: string;
      public durationMinutes!: number | null;
      public applicationDate!: Date | null;
      public status!: 'pending' | 'enabled' | 'submitted' | 'graded' | 'cancelled';
      public grade!: number | null;
}

ExamAssignments.init(
      {
            id: {
                  type: DataTypes.UUID,
                  defaultValue: DataTypes.UUIDV4,
                  primaryKey: true,
                  allowNull: false,
            },
            studentId: { type: DataTypes.UUID, allowNull: false },
            examId: { type: DataTypes.UUID, allowNull: false },
            professorId: { type: DataTypes.UUID, allowNull: false },
            durationMinutes: { type: DataTypes.INTEGER, allowNull: true },
            applicationDate: { type: DataTypes.DATE, allowNull: true },
            status: {
                  type: DataTypes.ENUM('pending', 'enabled', 'submitted', 'graded', 'cancelled'),
                  allowNull: false,
                  defaultValue: 'pending',
                  validate: { isIn: [['pending', 'enabled', 'submitted', 'graded', 'cancelled']] },
            },
            grade: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      },
      {
            sequelize,
            tableName: 'ExamAssignments',
            timestamps: true,
            indexes: [
                  { unique: true, fields: ['studentId', 'examId', 'professorId'] },
                  { fields: ['examId'] },
                  { fields: ['studentId'] },
                  { fields: ['professorId'] },
            ],
      },
);

export default ExamAssignments;
