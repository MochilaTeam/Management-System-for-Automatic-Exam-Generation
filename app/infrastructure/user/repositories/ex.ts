// // infrastructure/user/repositories/UserReadRepositorySequelize.ts
// import { Op, WhereOptions } from "sequelize";
// import {
//   IUserReadRepository,
//   ListUsersFilter,
//   UserReadModel,
// } from "../../../domains/user/domain/repositories/IUserReadRepository";
// import { UserModel } from "../persistence/sequelize/models/UserModel";
// import { toReadModel } from "../mappers/UserMapper";

// export class UserReadRepositorySequelize implements IUserReadRepository {
//   async findById(userId: string): Promise<UserReadModel | null> {
//     const row = await UserModel.findByPk(userId);
//     return row ? toReadModel(row) : null;
//   }

//   async list(filters: ListUsersFilter = {}): Promise<UserReadModel[]> {
//     const where: WhereOptions = {};
//     if (filters.role) where["role"] = filters.role;

//     if (filters.search) {
//       const s = `%${filters.search}%`;
//       // name o email “contiene” (Postgres)
//       where[Op.or] = [{ name: { [Op.iLike]: s } }, { email: { [Op.iLike]: s } }];
//     }

//     const rows = await UserModel.findAll({
//       where,
//       limit: filters.limit ?? 50,
//       offset: filters.offset ?? 0,
//       order: [["createdAt", "DESC"]],
//     });

//     return rows.map(toReadModel);
//   }
// }
