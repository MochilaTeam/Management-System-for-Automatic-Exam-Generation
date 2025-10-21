import { DataTypes, Model, STRING } from 'sequelize';

import { sequelize } from '../../../database/database';

class Subtopic extends Model {
    public id!: string;
    public topicId!: string;
    public name!: string;
}

Subtopic.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        topicId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'Topics', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        name: {
            type: STRING(200),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'Subtopics',
        indexes: [{ fields: ['topicId'] }, { unique: true, fields: ['topicId', 'name'] }],
    },
);

export default Subtopic;
