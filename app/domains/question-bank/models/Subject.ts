import { Model, STRING } from 'sequelize';

import Topic from './Topic';
import { sequelize } from '../../../database/database';

class Subject extends Model {
  public id!: string;
  public name!: string;
}

Subject.init(
  {
    id: { type: STRING, primaryKey: true },
    name: { type: STRING(200), allowNull: false, unique: true },
    program: { type: STRING(200), allowNull: false },
  },
  { sequelize, tableName: 'Subjects' },
);

export default Subject;
