import { Model, STRING } from 'sequelize';

import { sequelize } from '../../../database/database';

class Question extends Model {
  public id!: string;
}

Question.init(
  {
    id: {
      type: STRING,
      primaryKey: true,
    },
  },
  { sequelize },
);

export default Question;
