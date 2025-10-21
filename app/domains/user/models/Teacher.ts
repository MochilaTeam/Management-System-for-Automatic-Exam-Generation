import { Model, STRING, DataTypes, BOOLEAN } from 'sequelize';

import { sequelize } from '../../../database/database';

class Teacher extends Model {
    public id!: string;
    public name!: string;
    public specialty!: string;
    public userId!: string;
    public hasRoleSubjectLeader!: boolean;
    public hasRoleExaminer!: boolean
}

Teacher.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        name: { type: STRING(200), allowNull: false },
        specialty: { type: STRING(200), allowNull: false },
        hasRoleSubjectLeader: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false, 
        },
        hasRoleExaminer: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: { model: 'Users', key: 'id' },
        },
    },
    {
        sequelize,
        tableName: 'Teachers',
        timestamps: false,
        indexes: [{ unique: true, fields: ['userId'] }],
    },
);

export default Teacher;
