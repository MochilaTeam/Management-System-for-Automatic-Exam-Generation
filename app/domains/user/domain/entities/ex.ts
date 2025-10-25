// // domains/user/domain/models/User.ts

// export type UserRole = "TEACHER" | "STUDENT";

// export type UserProps = {
//   id: string;
//   name: string;
//   email: string;
//   role: UserRole;
//   createdAt: Date;
// };

// export class User {
//   private constructor(private readonly props: UserProps) {}

//   // Fábrica controlada: aplica invariantes del dominio
//   static create(input: { id?: string; name: string; email: string; role: UserRole; createdAt?: Date }): User {
//     const id = input.id ?? crypto.randomUUID();
//     const name = input.name.trim();
//     const email = input.email.toLowerCase();

//     if (!name) throw new Error("User.name no puede ser vacío");
//     if (!email.includes("@")) throw new Error("User.email inválido");
//     if (input.role !== "TEACHER" && input.role !== "STUDENT") throw new Error("User.role inválido");

//     return new User({
//       id,
//       name,
//       email,
//       role: input.role,
//       createdAt: input.createdAt ?? new Date(),
//     });
//   }

//   // Getters controlados (no exponemos props mutables)
//   get id()       { return this.props.id; }
//   get name()     { return this.props.name; }
//   get email()    { return this.props.email; }
//   get role()     { return this.props.role; }
//   get createdAt(){ return this.props.createdAt; }

//   // (Opcional) cambios de estado con invariantes
//   changeName(newName: string) {
//     const n = newName.trim();
//     if (!n) throw new Error("User.name no puede ser vacío");
//     (this as any).props = { ...this.props, name: n }; // si prefieres inmutabilidad estricta, devuelve un nuevo User
//   }

//   // Para cruzar boundaries sin filtrar detalles internos
//   toPrimitives(): UserProps {
//     return { ...this.props };
//   }
// }

// // Nota: Si TS te marca 'crypto' no definido, importa:
// // import crypto from "crypto";
