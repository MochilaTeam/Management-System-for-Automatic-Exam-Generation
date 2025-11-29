import { Model, INTEGER, DataTypes } from 'sequelize';

import { sequelize } from '../../../database/database';
class Student extends Model {
    public id!: string;
    public age!: number;
    public course!: string;
    public userId!: string;
}

Student.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        age: { type: INTEGER, allowNull: false },
        course: { type: DataTypes.STRING, allowNull: false },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true, // one user ↔ one student
            references: { model: 'Users', key: 'id' },
        },
    },
    {
        sequelize,
        tableName: 'Students',
        timestamps: false,
        indexes: [{ unique: true, fields: ['userId'] }],
    },
);

export default Student;
