import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../../../database/database';
import { AssignedExamStatus } from './enum/AssignedExamStatus';

class ExamAssignments extends Model {
    public id!: string;
    public studentId!: string;
    public examId!: string;
    public professorId!: string;
    public durationMinutes!: number | null;
    public applicationDate!: Date | null;
    public status!: AssignedExamStatus;
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
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: AssignedExamStatus.PENDING,
            validate: { isIn: [Object.values(AssignedExamStatus)] },
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
