import { DataTypes, Model, STRING } from 'sequelize';

import { sequelize } from '../../../database/database';

class Subject extends Model {
    public id!: string;
    public name!: string;
    public program!: string; //TODO: Programa de estudios, deberia ser un pdf
    public leadTeacherId!: string; //TODO: AGREGAR LA ASOCIACION
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
            allowNull: false,
            references: { model: 'Teachers', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },
    },
    { sequelize, tableName: 'Subjects' },
);

export default Subject;
