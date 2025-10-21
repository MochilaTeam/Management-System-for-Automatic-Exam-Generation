import { Model, DataTypes } from 'sequelize';

import { sequelize } from '../../../database/database';

class TeacherSubject extends Model {
  public teacherId!: string;
  public subjectId!: string;
}

TeacherSubject.init(
  {
    teacherId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: { model: 'Teachers', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    subjectId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: { model: 'Subjects', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
  },
  {
    sequelize,
    tableName: 'TeacherSubjects',
    indexes: [{ fields: ['teacherId'] }, { fields: ['subjectId'] }],
  },
);

export default TeacherSubject;
