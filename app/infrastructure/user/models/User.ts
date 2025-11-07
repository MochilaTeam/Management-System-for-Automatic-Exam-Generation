import { Model, STRING, DataTypes } from 'sequelize';

import { sequelize } from '../../../database/database';

class User extends Model {
    public id!: string;
    public name!: string;
    public passwordHash!: string;
    public email! : string;
    public active! : boolean;
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: STRING(100),
            allowNull: false,
            unique: true,
        },
        passwordHash: {
            type: STRING(255),
            allowNull: false,
        },
        email:{
            type: STRING(255),
            allowNull : false,
            unique: true,
        },
        active:{
            type: DataTypes.BOOLEAN,
            defaultValue: 1,
        }

    },
    {
        sequelize,
        tableName: 'Users',
        timestamps: true,
        indexes: [{ unique: true, fields: ['name'] }],
    },
);

export default User;
