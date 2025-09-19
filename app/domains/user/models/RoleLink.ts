// domain/user/RoleLink.js
import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class RoleLink extends Model {}

  RoleLink.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    roleId: { type: DataTypes.UUID, allowNull: false },
  }, { sequelize, modelName: "RoleLink", timestamps: false });

  return RoleLink;
};
