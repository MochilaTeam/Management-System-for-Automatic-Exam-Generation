import { Request, Response, NextFunction } from "express";
import {listUsersQuerySchema,createUserBodySchema} from "../../schemas/user"

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = listUsersQuerySchema.parse(req.query); 
    const result = await listUsersHandler.execute(dto);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const params = userIdParamsSchema.parse(req.params);
    const result = await getUserByIdHandler.execute(params);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createUserBodySchema.parse(req.body);
    const result = await container.createUserHandler.execute(body);
    res.status(201).json(result);
  } catch (err) { next(err); }
}
