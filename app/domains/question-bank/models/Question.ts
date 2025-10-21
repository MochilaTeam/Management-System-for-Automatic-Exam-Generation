import { Model, STRING, ENUM, INTEGER, JSON, TEXT, DataTypes } from 'sequelize';

import { sequelize } from '../../../database/database';
import { DifficultyValues } from './enums/enums';

class Question extends Model {
  public id!: string;
  public subTopicId!: string; 
  public authorId!: string;
  public difficulty!: (typeof DifficultyValues)[number];
  public body!: string;
  public questionTypeId!: string;
  public options!: Array<{ text: string; isCorrect: boolean }> | null; //TODO: CHEQUEAR BIEN EL TIPO DE ESTO
  public response!: string | null;
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
      type: STRING,
      allowNull: false,
      references: { model: 'QuestionTypes', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },

    difficulty: { type: ENUM(...DifficultyValues), allowNull: false },
    body: { type: STRING(1024), allowNull: false },
    options: { type: JSON, allowNull: true },
    response: { type: TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'Questions',
    indexes: [
      { name: 'q_subject_difficulty', fields: ['subjectId', 'difficulty'] },
      { name: 'q_question_type', fields: ['questionTypeId'] },
      { name: 'q_professor', fields: ['professorId'] },
      { name: 'q_unique_subject_body', unique: true, fields: ['subjectId', 'body'] },
    ],
  },
);

export default Question;
