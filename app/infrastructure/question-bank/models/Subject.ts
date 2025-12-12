import { DataTypes, Model, STRING } from 'sequelize';

import { sequelize } from '../../../database/database';

class Subject extends Model {
    public id!: string;
    public name!: string;
    public program!: string;
    public leadTeacherId!: string;
    public active!: boolean;
}

Subject.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },

        name: { type: STRING(200), allowNull: false, unique: true },
        program: { type: STRING, allowNull: false },

        leadTeacherId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'Teachers', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    { sequelize, tableName: 'Subjects' },
);

export default Subject;
