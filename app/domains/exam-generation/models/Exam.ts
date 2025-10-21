import { Model, DATE, ENUM, INTEGER, STRING, TEXT, JSON, DataTypes } from 'sequelize';

import { sequelize } from '../../../database/database';
import { DifficultyValues } from '../../question-bank/models/enums/enums';

class Exam extends Model {
    public id!: number;

    public difficulty!: (typeof DifficultyValues)[number];

    public examStateId!: string; // FK -> ExamStates.id (obligatoria)

    // ↓ VIRTUAL: nombre del estado (derivado de la asociación "state")
    // public examStateName!: ExamState | null;  //TODO:DESPUES AGREGAR ESTO COMO UN CAMPO VIRTUAL

    public authorId!: number; // FK -> profesores.id (obligatoria)
    public validatorId!: number; // FK -> jefe_de_asignature.id (obligatoria)
    public observations!: string | null;

    public questionCount!: number;
    public topicProportion!: Record<string, number> | null; // p.ej. { "algebra": 0.4, "geometria": 0.6 }
    public topicCoverage!: Record<string, unknown> | null; // p.ej. { requiredTopics: ["algebra","geometria"], minPerTopic: 2 }
    //TODO: quiza despues distribuir topic coverage en varios atributos

    public validatedAt!: Date | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initExam = () => {
    Exam.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            }, //TODO: Fijarme por el de Camilo

            difficulty: { type: ENUM(...DifficultyValues), allowNull: false },
            examStateId: {
                type: STRING,
                allowNull: false,
                references: { model: 'ExamStates', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },

            authorId: {
                type: INTEGER,
                allowNull: false,
                references: { model: 'Profesores', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },

            validatorId: {
                type: INTEGER,
                allowNull: true,
                references: { model: 'Profesores', key: 'id' }, //TODO: Tabla profesores en mayuscula
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },

            observations: { type: TEXT },

            questionCount: { type: INTEGER, allowNull: false },
            topicProportion: { type: JSON, allowNull: false },
            topicCoverage: { type: JSON, allowNull: false },

            validatedAt: { type: DATE },

            // examStateName: {
            //   type: VIRTUAL(ENUM(...ExamStateNameValues)),
            //   get(this: Exam) {
            //     const state = (this as any).getDataValue('state');
            //     const name: unknown = state?.name;
            //     return (ExamStateNameValues as readonly string[]).includes(String(name))
            //       ? (name as ExamState)
            //       : null;
            //   }
            // }
        },
        {
            sequelize,
            tableName: 'Exams',
            // defaultScope: {
            //   include: [{ model: ExamState, as: 'state', attributes: ['id', 'name'] }],
            // },
            indexes: [
                { fields: ['examStateId'] },
                { fields: ['difficulty'] },
                { fields: ['createdAt'] },
                { fields: ['authorId'] },
                { fields: ['questionCount'] },
            ],
        },
    );
    return Exam;
};

export default Exam;

//TODO: Hacer la relacion de examen con asugnatura
//TODO: Hacer la semilla de los primeros valores en la tabla
