import { Model, INTEGER, STRING } from 'sequelize';

import { sequelize } from '../../../database/database';

class TeacherSubject extends Model {
  public professorId!: number;
  public subjectId!: string;
}

TeacherSubject.init(
  {
    professorId: {
      type: INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'profesores', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    subjectId: {
      type: STRING,
      allowNull: false,
      primaryKey: true,
      references: { model: 'Subjects', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'TeacherSubjects',
    indexes: [{ fields: ['professorId'] }, { fields: ['subjectId'] }],
  },
);

export default TeacherSubject;
export { TeacherSubject };
