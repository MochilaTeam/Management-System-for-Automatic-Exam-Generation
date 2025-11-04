import { Model, STRING, DataTypes } from 'sequelize';

import { sequelize } from '../../../database/database';
//TODO: USER NO DEBERIA TENER EMAIL?
class User extends Model {
    public id!: string;
    public username!: string;
    public passwordHash!: string;
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        username: {
            type: STRING(100),
            allowNull: false,
            unique: true,
        },
        passwordHash: {
            type: STRING(255),
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'Users',
        timestamps: true,
        indexes: [{ unique: true, fields: ['username'] }],
    },
);

export default User;
