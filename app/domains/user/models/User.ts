import { DataTypes, Model } from "sequelize";
import bcrypt from "bcrypt";

export default (sequelize) => {
  class User extends Model {
    async checkPassword(password) {
      return bcrypt.compare(password, this.passwordHash);
    }
  }

  User.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    firstName: { type: DataTypes.STRING },
    lastName: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { sequelize, modelName: "User", timestamps: true });

  return User;
};
