import { Model, STRING } from 'sequelize';

import SubjectTopic from './SubjectTopic';
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

Subject.belongsToMany(Topic, {
  through: SubjectTopic,
  as: 'topics',
  foreignKey: 'subjectId',
  otherKey: 'topicId',
});

export default Subject;
