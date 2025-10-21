import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../../../database/database';

class SubjectTopic extends Model {
    public topicId!: string;
    public subjectId!: string;
}

SubjectTopic.init(
    {
        topicId: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            references: { model: 'Topics', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        subjectId: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            references: { model: 'Subjects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
    },
    {
        sequelize,
        tableName: 'SubjectTopics',
        indexes: [{ fields: ['subjectId'] }, { fields: ['topicId'] }],
    },
);

export default SubjectTopic;
