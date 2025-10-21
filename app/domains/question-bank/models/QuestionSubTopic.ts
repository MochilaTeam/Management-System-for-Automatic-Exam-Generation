import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../../../database/database';

class QuestionSubtopic extends Model {
    public questionId!: string;
    public subtopicId!: string;
}

QuestionSubtopic.init(
    {
        questionId: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            references: { model: 'Questions', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        subtopicId: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            references: { model: 'Subtopics', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
    },
    {
        sequelize,
        tableName: 'QuestionSubtopics',
        indexes: [{ fields: ['questionId'] }, { fields: ['subtopicId'] }],
    },
);

export default QuestionSubtopic;
