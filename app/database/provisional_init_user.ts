import { Sequelize } from "sequelize";
import User from "../domains/user/models/User";
import Role from "../domains/user/models/Role";
import RoleLink from "../domains/user/models/RoleLink";

export function initModels(sequelize: Sequelize) {
  const UserModel = User(sequelize);
  const RoleModel = Role(sequelize);
  const RoleLinkModel = RoleLink(sequelize);

  // Asociaciones
  UserModel.belongsToMany(RoleModel, { through: RoleLinkModel, foreignKey: "userId" });
  RoleModel.belongsToMany(UserModel, { through: RoleLinkModel, foreignKey: "roleId" });

  return { UserModel, RoleModel, RoleLinkModel };
}
