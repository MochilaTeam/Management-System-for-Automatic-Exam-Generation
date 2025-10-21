import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../../../database/database';

class ExamRegrades extends Model {
    public id!: string;
    public studentId!: string;
    public examId!: string;
    public professorId!: string;
    public reason!: string | null;
    public status!: 'requested' | 'in_review' | 'resolved' | 'rejected';
    public requestedAt!: Date;
    public resolvedAt!: Date | null;
    public finalGrade!: number | null;
}

ExamRegrades.init(
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
        reason: { type: DataTypes.TEXT, allowNull: true },
        status: {
            type: DataTypes.ENUM('requested', 'in_review', 'resolved', 'rejected'),
            allowNull: false,
            defaultValue: 'requested',
            validate: { isIn: [['requested', 'in_review', 'resolved', 'rejected']] },
        },
        requestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        resolvedAt: { type: DataTypes.DATE, allowNull: true },
        finalGrade: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    },
    {
        sequelize,
        tableName: 'ExamRegrades',
        timestamps: true,
        indexes: [{ fields: ['examId'] }, { fields: ['studentId'] }, { fields: ['professorId'] }],
    },
);

export default ExamRegrades;
