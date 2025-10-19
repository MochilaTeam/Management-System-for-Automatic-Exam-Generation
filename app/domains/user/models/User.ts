import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface UserAttributes {
  id: number;
  nick: string;
  hashContrasenna: string;
}

export type UserCreationAttributes = Optional<UserAttributes, 'id'>;

export class User extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!: number;
  public nick!: string;
  public hashContrasenna!: string;
}

export default function defineUser(sequelize: Sequelize) {
  User.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nick: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { len: [3, 50] },
      },
      hashContrasenna: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: false,
      indexes: [{ unique: true, fields: ['nick'] }],
    }
  );

  return User;
}
