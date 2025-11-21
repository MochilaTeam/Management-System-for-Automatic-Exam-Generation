import { Model, STRING, JSON, TEXT, DataTypes, BOOLEAN } from 'sequelize';

import { sequelize } from '../../../database/database';
import { DifficultyLevelEnum } from '../../../domains/question-bank/entities/enums/DifficultyLevels';

class Question extends Model {
    public id!: string;
    public subTopicId!: string;
    public authorId!: string;
    public difficulty!: DifficultyLevelEnum;
    public body!: string;
    public questionTypeId!: string;
    public options!: Array<{ text: string; isCorrect: boolean }> | null; //TODO: CHEQUEAR BIEN EL TIPO DE ESTO
    public response!: string | null;
    public active!: boolean;
}

Question.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },

        authorId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'Teachers', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },

        questionTypeId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'QuestionTypes', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },

        subTopicId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'Subtopics', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
        },

        difficulty: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [Object.values(DifficultyLevelEnum)],
            },
            defaultValue: DifficultyLevelEnum.MEDIUM,
        },

        body: { type: STRING(1024), allowNull: false },
        options: { type: JSON, allowNull: true },
        response: { type: TEXT, allowNull: true },
        active: {
            type: BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'Questions',
        indexes: [
            { name: 'q_subject_difficulty', fields: ['subTopicId', 'difficulty'] },
            { name: 'q_question_type', fields: ['questionTypeId'] },
            { name: 'q_author', fields: ['authorId'] },
        ],
    },
);

export default Question;
