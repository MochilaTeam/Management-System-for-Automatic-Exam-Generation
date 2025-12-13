import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../../../database/database';

class LeaderSubject extends Model {
    public teacherId!: string;
    public subjectId!: string;
}

LeaderSubject.init(
    {
        teacherId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'Teachers', key: 'id' },
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
        tableName: 'LeaderSubjects',
        indexes: [
            { fields: ['teacherId'] },
            { unique: true, fields: ['subjectId'] },
        ],
    },
);

export default LeaderSubject;
