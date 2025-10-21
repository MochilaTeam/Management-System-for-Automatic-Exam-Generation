import { Model, STRING } from 'sequelize';

import { sequelize } from '../../../database/database';

class SubjectTopic extends Model {
    public topicId!: string;
    public subjectId!: string;
}

SubjectTopic.init(
    {
        topicId: {
            type: STRING,
            allowNull: false,
            primaryKey: true,
            references: { model: 'Topics', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        subjectId: {
            type: STRING,
            allowNull: false,
            primaryKey: true,
            references: { model: 'Subjects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
    },
    {
        sequelize,
        tableName: 'SubjectTopics',
        indexes: [{ fields: ['subjectId'] }, { fields: ['topicId'] }],
    },
);

export default SubjectTopic;
