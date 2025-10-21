import { Model, DATE, ENUM, INTEGER, TEXT, JSON, DataTypes } from 'sequelize';

import { ExamStatusEnum } from './enums/ExamStatusEnum';
import { sequelize } from '../../../database/database';
import { DifficultyValues } from '../../question-bank/models/enums/enums';

class Exam extends Model {
    public id!: string;

    public difficulty!: (typeof DifficultyValues)[number];

    public examStatus!: ExamStatusEnum;

    public authorId!: string; // FK -> profesores.id (obligatoria)
    public validatorId!: string; // FK -> jefe_de_asignature.id
    public subjectId!: string; //FK -> subject.id (obligatoria)
    public observations!: string | null;

    public questionCount!: number;
    public topicProportion!: Record<string, number> | null; // p.ej. { "algebra": 0.4, "geometria": 0.6 }
    public topicCoverage!: Record<string, unknown> | null; // p.ej. { requiredTopics: ["algebra","geometria"], minPerTopic: 2 }
    //TODO: quiza despues distribuir topic coverage en varios atributos

    public validatedAt!: Date | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Exam.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },

        difficulty: { type: ENUM(...DifficultyValues), allowNull: false },

        authorId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'Teachers', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        }, //TODO: AÑADIR CHECKS DE QUE AUTHOR SEA DE ROL EXAMINADOR Y VALIDADOR ROL JEFE DE ASIGNATURA?
        // ESO HACERLO DESPUES, QUE CADA UNO HAGA LAS LOGICAS DE SU MODELOS

        validatorId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'Teachers', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },

        subjectId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'Subjects', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },

        observations: { type: TEXT },

        questionCount: { type: INTEGER, allowNull: false },
        topicProportion: { type: JSON, allowNull: false },
        topicCoverage: { type: JSON, allowNull: false },

        validatedAt: { type: DATE },
        examStatus: {
          type: DataTypes.STRING(20),
          allowNull: false,
          validate: {
            isIn: [Object.values(ExamStatusEnum)],
          },
          defaultValue: ExamStatusEnum.DRAFT,
        },
    },
    {
        sequelize,
        tableName: 'Exams',
        indexes: [
            { fields: ['difficulty'] },
            { fields: ['createdAt'] },
            { fields: ['authorId'] },
            { fields: ['questionCount'] },
        ],
    },
);

export default Exam;

