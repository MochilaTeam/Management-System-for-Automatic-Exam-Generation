// import { Request, Response, NextFunction } from "express";
// import { parseEnv } from "util";
// // Los schemas se importan desde schemas
// // Los handlers se importan desde dependencies (Una dependencia que construye el handler)

// // ---------- Controllers (delgados): validan → llaman handler → responden

// // GET /v1/users
// export async function listUsers(req: Request, res: Response, next: NextFunction) {
//   try {
//     const dto = listUsersQuerySchema.parse(req.query); //Crea el schema de la query
//     // Handler de Query (application/queries/handlers/ListUsersHandler.ts)
//     const result = await listUsersHandler.execute(dto);
//     res.status(200).json(result); // result debería ser un BaseResponse
//   } catch (err) { next(err); }
// }

// // GET /v1/users/:userId
// export async function getUserById(req: Request, res: Response, next: NextFunction) {
//   try {
//     const params = userIdParamsSchema.parse(req.params);
//     // Handler de Query (application/queries/handlers/GetUserByIdHandler.ts)
//     const result = await getUserByIdHandler.execute(params);
//     res.status(200).json(result);
//   } catch (err) { next(err); }
// }

// // POST /v1/users
// export async function createUser(req: Request, res: Response, next: NextFunction) {
//   try {
//     const body = createUserBodySchema.parse(req.body);
//     // Handler de Command (application/commands/handlers/CreateUserHandler.ts)
//     const result = await container.createUserHandler.execute(body);
//     res.status(201).json(result);
//   } catch (err) { next(err); }
// }
