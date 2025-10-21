import { Model, STRING } from 'sequelize';

import { sequelize } from '../../../database/database';

class QuestionSubtopic extends Model {
    public questionId!: string;
    public subtopicId!: string;
}

QuestionSubtopic.init(
    {
        questionId: {
            type: STRING,
            allowNull: false,
            primaryKey: true,
            references: { model: 'Questions', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        subtopicId: {
            type: STRING,
            allowNull: false,
            primaryKey: true,
            references: { model: 'Subtopics', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
    },
    {
        sequelize,
        tableName: 'QuestionSubtopics',
        indexes: [{ fields: ['questionId'] }, { fields: ['subtopicId'] }],
    },
);

export default QuestionSubtopic;
