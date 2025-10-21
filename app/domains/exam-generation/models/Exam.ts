import { Model, DATE, ENUM, INTEGER, STRING, TEXT, JSON, DataTypes } from 'sequelize';

import { sequelize } from '../../../database/database';
import { DifficultyValues } from '../../question-bank/models/enums/enums';
import { ExamStatusEnum } from './enums/ExamStatusEnum';

class Exam extends Model {
  public id!: string;

  public difficulty!: (typeof DifficultyValues)[number];

  public ExamStatus!: ExamStatusEnum;


  public authorId!: string; // FK -> profesores.id (obligatoria)
  public validatorId!: string; // FK -> jefe_de_asignature.id 
  public subjectId!: string  //FK -> subject.id (obligatoria)
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
      references: {model: 'Subjects', key: 'id'},
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },

    observations: { type: TEXT },

    questionCount: { type: INTEGER, allowNull: false },
    topicProportion: { type: JSON, allowNull: false },
    topicCoverage: { type: JSON, allowNull: false },

    validatedAt: { type: DATE },
    //TODO: Agregar examstatus
    //TODO: Agregar tambien una lista de questions?
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

export default Exam;

//TODO: Hacer la relacion de examen con asugnatura
//TODO: Hacer la semilla de los primeros valores en la tabla
//TODO: MIRAR ESTE CAMPO VALIDATE