// // infrastructure/user/mappers/UserMapper.ts
// import { User } from "../../../domains/user/domain/models/User";
// import {
//   UserReadModel,
// } from "../../../domains/user/domain/repositories/IUserReadRepository";
// // Ajusta estos paths según tu estructura real
// import { UserModel } from "../persistence/sequelize/models/UserModel";
// import { TeacherModel } from "../persistence/sequelize/models/TeacherModel";
// import { StudentModel } from "../persistence/sequelize/models/StudentModel";

// export type UserPersistence = {
//   id?: string;
//   name: string;
//   email: string;
//   role: "TEACHER" | "STUDENT";
//   createdAt?: Date;
//   updatedAt?: Date;
// };

// // ReadModel extendido (si traes asociaciones)
// export type UserWithProfileReadModel = UserReadModel & {
//   teacher?: { department?: string | null; title?: string | null };
//   student?: { enrollmentNumber: string; cohortYear?: number | null };
// };

// export const UserMapper = {
//   // ORM → Dominio (para comandos / invariantes)
//   toDomain(row: UserModel): User {
//     return User.create({
//       id: row.getDataValue("id"),
//       name: row.getDataValue("name"),
//       email: row.getDataValue("email"),
//       role: row.getDataValue("role"),
//       createdAt: row.getDataValue("createdAt"),
//     });
//   },

//   // Dominio → Persistencia (para crear/actualizar con ORM)
//   toPersistence(agg: User): UserPersistence {
//     const u = agg.toPrimitives();
//     return {
//       id: u.id,
//       name: u.name,
//       email: u.email,
//       role: u.role,
//       createdAt: u.createdAt,
//       // updatedAt lo deja el ORM si quieres
//     };
//   },

//   // ORM → ReadModel (DTO para lecturas simples)
//   toReadModel(row: UserModel): UserReadModel {
//     return {
//       id: row.getDataValue("id"),
//       name: row.getDataValue("name"),
//       email: row.getDataValue("email"),
//       role: row.getDataValue("role"),
//       createdAt: new Date(row.getDataValue("createdAt")).toISOString(),
//     };
//   },

//   // ORM (+ asociaciones) → ReadModel extendido
//   toReadModelWithProfile(
//     row: UserModel & {
//       teacherProfile?: TeacherModel | null;
//       studentProfile?: StudentModel | null;
//     }
//   ): UserWithProfileReadModel {
//     const base: UserWithProfileReadModel = {
//       id: row.getDataValue("id"),
//       name: row.getDataValue("name"),
//       email: row.getDataValue("email"),
//       role: row.getDataValue("role"),
//       createdAt: new Date(row.getDataValue("createdAt")).toISOString(),
//     };

//     const t = row.teacherProfile;
//     if (t) {
//       base.teacher = {
//         department: t.getDataValue("department"),
//         title: t.getDataValue("title"),
//       };
//     }

//     const s = row.studentProfile;
//     if (s) {
//       base.student = {
//         enrollmentNumber: s.getDataValue("enrollmentNumber"),
//         cohortYear: s.getDataValue("cohortYear"),
//       };
//     }

//     return base;
//   },
// };
