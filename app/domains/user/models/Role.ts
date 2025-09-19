import { DataTypes, Model } from "sequelize";

export default (sequelize) => {
  class Role extends Model {}

  Role.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, unique: true, allowNull: false },
    description: { type: DataTypes.STRING },
  }, { sequelize, modelName: "Role", timestamps: false });

  return Role;
};
