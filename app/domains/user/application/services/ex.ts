// import { IUserRepository } from "../../domain/repositories/IUserRepository";
// import { IUserReadRepository, UserReadModel } from "../../domain/repositories/IUserReadRepository";
// import { User } from "../../domain/models/User";

// export class UserService {
//   constructor(
//     private userRepo: IUserRepository,
//   ) {}

//   // Command: crear usuario (reglas + persistencia)
//   async createUser(input: { name: string; email: string; role: "TEACHER" | "STUDENT" }): Promise<UserReadSchema> {
//     const exists = await this.userRepo.emailExists(input.email);
//     if (exists) throw new Error("Email ya registrado");

//     const user = User.create(input);     // reglas de dominio
//     await this.writeRepo.save(user);     // persistir

//     // read-back (o mapear user a ReadModel aquí)
//     const read = await this.readRepo.findById(user.toPrimitives().id);
//     if (!read) throw new Error("No se pudo leer el usuario recién creado");
//     return read;
//   }

//   // Query: lectura pura
//   async getUserById(userId: string): Promise<UserReadModel | null> {
//     return this.readRepo.findById(userId);
//   }
// }
