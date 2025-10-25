# Guía de desarrollo de endpoints (con ejemplo del dominio **user**)

> Objetivo: ofrecer un **paso a paso práctico** para crear endpoints siguiendo tu arquitectura (Clean/Hexagonal + DDD), usando el **dominio `user`** como ejemplo. Mantiene **rutas → controladores → esquemas → handlers (queries/commands) → servicios → puertos → repos (infra)**.

---

## 0) Convenciones y estructura base

- **Prefijo de versión** en `app.ts`: `app.use('/v1/users', userRoutes)`.
- **Rutas relativas** dentro del router (`/`, `/:userId`).
- **Validación** con `zod` vía `core/middlewares/requestValidator.ts`.
- **Respuesta estándar** con `shared/domain/base_response.ts`.
- **Inyección de dependencias (DI)** en `core/dependencies/dependencies.ts`.

Rutas clave (coherentes con tu árbol actual):

```
domains/user/
  api/
    routes/userRoutes.ts
    controllers/UserController.ts
  application/
    queries/{GetUserByIdQuery.ts, handlers/GetUserByIdHandler.ts}
    commands/{CreateUserCommand.ts, handlers/CreateUserHandler.ts}
    services/UserService.ts
  domain/
    entities/User.entity.ts
    ports/{IUserRepository.ts, IUserReadRepository.ts}
  schemas/userSchemas.ts

infrastructure/user/
  models/User.ts                // Modelo ORM (Sequelize)
  mappers/UserMapper.ts
  repositories/
    UserRepositorySequelize.ts       // implements IUserRepository
    UserReadRepositorySequelize.ts   // implements IUserReadRepository

core/dependencies/dependencies.ts
app.ts
```

---

## 1) Schemas (contratos de entrada)

**`domains/user/schemas/userSchemas.ts`**
```ts
import { z } from "zod";

export const listUsersQuerySchema = z.object({
  role: z.enum(["TEACHER", "STUDENT"]).optional(),
  search: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const userIdParamsSchema = z.object({
  userId: z.string().uuid(),
});

export const createUserBodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["TEACHER", "STUDENT"]),
  password: z.string().min(8),
});
```

---

## 2) Controladores (delgados)

**`domains/user/api/controllers/UserController.ts`**
```ts
import { Request, Response, NextFunction } from "express";
import { container } from "../../../../core/dependencies/dependencies";
import { listUsersQuerySchema, userIdParamsSchema, createUserBodySchema } from "../../schemas/userSchemas";

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = listUsersQuerySchema.parse(req.query);
    const result = await container.listUsersHandler.execute(dto);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = userIdParamsSchema.parse(req.params);
    const result = await container.getUserByIdHandler.execute({ userId });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = createUserBodySchema.parse(req.body);
    const result = await container.createUserHandler.execute(dto);
    res.status(201).json(result);
  } catch (err) { next(err); }
}
```

> Nota: si prefieres, puedes mover la validación al middleware `requestValidator` y usar `req.validated`.

---

## 3) Rutas (prefijo montado en `app.ts`)

**`domains/user/api/routes/userRoutes.ts`**
```ts
import { Router } from "express";
import { listUsers, getUserById, createUser } from "../controllers/UserController";

const router = Router();

// GET /v1/users
router.get("/", listUsers);

// GET /v1/users/:userId
router.get("/:userId", getUserById);

// POST /v1/users
router.post("/", createUser);

export default router;
```

**`app.ts` (extracto)**  
```ts
import express from "express";
import userRoutes from "./domains/user/api/routes/userRoutes";
import { errorHandler } from "./core/middlewares/errorHandler";

const app = express();
app.use(express.json());

app.use("/v1/users", userRoutes);  // prefijo

app.use(errorHandler);
app.listen(process.env.PORT || 3000);
```

---

## 4) Application: Queries & Commands (Handlers)

**Query DTO** — `domains/user/application/queries/GetUserByIdQuery.ts`
```ts
export type GetUserByIdQuery = { userId: string };
```

**Query Handler** — `domains/user/application/queries/handlers/GetUserByIdHandler.ts`
```ts
import { GetUserByIdQuery } from "../GetUserByIdQuery";
import { UserService } from "../../services/UserService";
import { BaseResponse } from "../../../../shared/domain/base_response";

export class GetUserByIdHandler {
  constructor(private svc: UserService) {}

  async execute(q: GetUserByIdQuery) {
    if (!q.userId) return BaseResponse.fail("userId requerido", "INVALID_INPUT");
    const user = await this.svc.getUserById(q.userId);
    if (!user) return BaseResponse.fail("Usuario no encontrado", "USER_NOT_FOUND");
    return BaseResponse.success(user);
  }
}
```

**Command DTO** — `domains/user/application/commands/CreateUserCommand.ts`
```ts
export type CreateUserCommand = {
  name: string;
  email: string;
  role: "TEACHER" | "STUDENT";
  password: string; // si la lógica la maneja otro servicio, puedes derivarla
};
```

**Command Handler** — `domains/user/application/commands/handlers/CreateUserHandler.ts`
```ts
import { CreateUserCommand } from "../CreateUserCommand";
import { UserService } from "../../services/UserService";
import { BaseResponse } from "../../../../shared/domain/base_response";

export class CreateUserHandler {
  constructor(private svc: UserService) {}

  async execute(cmd: CreateUserCommand) {
    if (!cmd.name || !cmd.email) return BaseResponse.fail("name y email requeridos", "INVALID_INPUT");
    const created = await this.svc.createUser(cmd);
    return BaseResponse.success(created);
  }
}
```

---

## 5) Service (orquestación)

**`domains/user/application/services/UserService.ts`**
```ts
import { IUserRepository } from "../../domain/ports/IUserRepository";
import { IUserReadRepository, UserReadModel } from "../../domain/ports/IUserReadRepository";
import { User } from "../../domain/entities/User.entity";

export class UserService {
  constructor(private writeRepo: IUserRepository, private readRepo: IUserReadRepository) {}

  async createUser(input: { name: string; email: string; role: "TEACHER" | "STUDENT"; password: string }): Promise<UserReadModel> {
    const exists = await this.writeRepo.emailExists(input.email);
    if (exists) throw new Error("Email ya registrado");

    // Reglas de dominio
    const user = User.create({ name: input.name, email: input.email, role: input.role });

    // Persistencia (escritura)
    await this.writeRepo.save(user /*, password si aplicara*/);

    // Lectura (proyección)
    const read = await this.readRepo.findById(user.id);
    if (!read) throw new Error("No se pudo leer el usuario recién creado");
    return read;
  }

  async getUserById(userId: string): Promise<UserReadModel | null> {
    return this.readRepo.findById(userId);
  }

  async listUsers(filters: { role?: "TEACHER" | "STUDENT"; search?: string; limit?: number; offset?: number } = {}): Promise<UserReadModel[]> {
    return this.readRepo.list(filters);
  }
}
```

---

## 6) Dominio: Entidad y Puertos (interfaces)

**Entidad** — `domains/user/domain/entities/User.entity.ts`
```ts
import crypto from "crypto";
export type UserRole = "TEACHER" | "STUDENT";

export class User {
  private constructor(private props: { id: string; name: string; email: string; role: UserRole; createdAt: Date }) {}

  static create(p: { id?: string; name: string; email: string; role: UserRole; createdAt?: Date }): User {
    const name = p.name.trim();
    const email = p.email.toLowerCase();
    if (!name) throw new Error("User.name vacío");
    if (!email.includes("@")) throw new Error("User.email inválido");
    return new User({ id: p.id ?? crypto.randomUUID(), name, email, role: p.role, createdAt: p.createdAt ?? new Date() });
  }

  get id() { return this.props.id; }
  toPrimitives() { return { ...this.props }; }
}
```

**Puertos** — `domains/user/domain/ports/IUserRepository.ts`
```ts
import { User } from "../entities/User.entity";

export interface IUserRepository {
  emailExists(email: string): Promise<boolean>;
  save(user: User): Promise<void>;
  delete(userId: string): Promise<void>;
}
```

**Puertos (lectura)** — `domains/user/domain/ports/IUserReadRepository.ts`
```ts
export type UserReadModel = { id: string; name: string; email: string; role: "TEACHER" | "STUDENT"; createdAt: string; };

export interface IUserReadRepository {
  findById(userId: string): Promise<UserReadModel | null>;
  list(filters?: { role?: "TEACHER" | "STUDENT"; search?: string; limit?: number; offset?: number }): Promise<UserReadModel[]>;
}
```

---

## 7) Infraestructura: ORM, Mapper, Repos

**Modelo ORM** — `infrastructure/user/models/User.ts`
```ts
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../../database/database"; // ajusta ruta si es distinta

export class UserModel extends Model {
  declare id: string; declare name: string; declare email: string; declare role: "TEACHER" | "STUDENT";
  declare createdAt: Date; declare updatedAt: Date;
}

UserModel.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  role: { type: DataTypes.ENUM("TEACHER", "STUDENT"), allowNull: false },
}, {
  sequelize, tableName: "Users", timestamps: true,
  indexes: [{ name: "users_email_unique", unique: true, fields: ["email"] }],
});
```

**Mapper** — `infrastructure/user/mappers/UserMapper.ts`
```ts
import { User } from "../../../domains/user/domain/entities/User.entity";
import { UserModel } from "../models/User";
import { UserReadModel } from "../../../domains/user/domain/ports/IUserReadRepository";

export const toPersistence = (u: User) => {
  const p = u.toPrimitives();
  return { id: p.id, name: p.name, email: p.email, role: p.role, createdAt: p.createdAt };
};

export const toReadModel = (row: UserModel): UserReadModel => ({
  id: row.getDataValue("id"),
  name: row.getDataValue("name"),
  email: row.getDataValue("email"),
  role: row.getDataValue("role"),
  createdAt: row.getDataValue("createdAt").toISOString(),
});
```

**Repositorio (lectura)** — `infrastructure/user/repositories/UserReadRepositorySequelize.ts`
```ts
import { Op, WhereOptions } from "sequelize";
import { IUserReadRepository, UserReadModel } from "../../../domains/user/domain/ports/IUserReadRepository";
import { UserModel } from "../models/User";
import { toReadModel } from "../mappers/UserMapper";

export class UserReadRepositorySequelize implements IUserReadRepository {
  async findById(userId: string): Promise<UserReadModel | null> {
    const row = await UserModel.findByPk(userId);
    return row ? toReadModel(row) : null;
  }

  async list({ role, search, limit = 50, offset = 0 }: any = {}): Promise<UserReadModel[]> {
    const where: WhereOptions = {};
    if (role) where["role"] = role;
    if (search) where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { email: { [Op.iLike]: `%${search}%` } }];
    const rows = await UserModel.findAll({ where, limit, offset, order: [["createdAt", "DESC"]] });
    return rows.map(toReadModel);
  }
}
```

**Query DTO** — `domains/user/application/queries/ListUsersQuery.ts`
```ts
export type ListUsersQuery = {
  role?: "TEACHER" | "STUDENT";
  search?: string;
  limit?: number;
  offset?: number;
};
```

**Query Handler** — `domains/user/application/queries/handlers/ListUsersHandler.ts`
```ts
import { ListUsersQuery } from "../ListUsersQuery";
import { UserService } from "../../services/UserService";
import { BaseResponse } from "../../../../shared/domain/base_response";

export class ListUsersHandler {
  constructor(private svc: UserService) {}
  async execute(q: ListUsersQuery) {
    const data = await this.svc.listUsers(q ?? {});
    return BaseResponse.success(data);
  }
}
```

**Rutas (GET /v1/users)** — `domains/user/api/routes/userRoutes.ts` (ya mostrado arriba).

---

## 8) DI (Composition Root)

**Patch sugerido para `core/dependencies/dependencies.ts`**  
```diff
+ import { UserReadRepositorySequelize } from "../../infrastructure/user/repositories/UserReadRepositorySequelize";
+ import { ListUsersHandler } from "../../domains/user/application/queries/handlers/ListUsersHandler";

  const userWriteRepo = new UserRepositorySequelize();
+ const userReadRepo  = new UserReadRepositorySequelize();
- const userService   = new UserService(userWriteRepo, /* readRepo? */);
+ const userService   = new UserService(userWriteRepo, userReadRepo);

  export const container = {
    createUserHandler:   new CreateUserHandler(userService),
    getUserByIdHandler:  new GetUserByIdHandler(userService),
+   listUsersHandler:    new ListUsersHandler(userService),
  };
```

---

## 9) Pruebas rápidas del endpoint (cURL)

**Listar usuarios**
```bash
curl "http://localhost:3000/v1/users?role=TEACHER&search=ada&limit=10&offset=0"
```

**Obtener por ID**
```bash
curl http://localhost:3000/v1/users/3c0a9d54-0000-4000-8000-000000000001
```

**Crear usuario**
```bash
curl -X POST http://localhost:3000/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "role": "TEACHER",
    "password": "S3gura123!"
  }'
```
