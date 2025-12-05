import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../../../database/database';

class ExamQuestion extends Model {
    public id!: string;
    public examId!: string;
    public questionId!: string;
    public questionIndex!: number;
    public questionScore!: number;
}
ExamQuestion.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        examId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'Exams', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        questionId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'Questions', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        questionIndex: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        questionScore: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'ExamQuestions',
        indexes: [
            { unique: true, fields: ['examId', 'questionId'] },
            { unique: true, fields: ['examId', 'questionIndex'] },
            { fields: ['examId'] },
            { fields: ['questionId'] },
        ],
    },
);

export default ExamQuestion;
