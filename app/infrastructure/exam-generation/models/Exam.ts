import { Model, DATE, INTEGER, TEXT, JSON, DataTypes } from 'sequelize';

import { sequelize } from '../../../database/database';
import { ExamStatusEnum } from '../../../domains/exam-application/entities/enums/ExamStatusEnum';
import { DifficultyLevelEnum } from '../../../domains/question-bank/entities/enums/DifficultyLevels';

class Exam extends Model {
    public id!: string;
    public title!: string;

    public difficulty!: DifficultyLevelEnum;
    public examStatus!: ExamStatusEnum;

    public authorId!: string;
    public validatorId!: string;
    public subjectId!: string;
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
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },

        authorId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'Teachers', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        }, //TODO: AÑADIR CHECKS DE QUE AUTHOR SEA DE ROL EXAMINADOR Y VALIDADOR ROL JEFE DE ASIGNATURA?

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
        difficulty: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [Object.values(DifficultyLevelEnum)],
            },
            defaultValue: DifficultyLevelEnum.MEDIUM,
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
