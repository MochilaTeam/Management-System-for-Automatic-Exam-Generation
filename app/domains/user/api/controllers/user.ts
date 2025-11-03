import { Request, Response, NextFunction } from "express";
import {listUsersQuerySchema,userIdParamsSchema,createUserBodySchema, updateUserBodySchema} from "../../schemas/user";

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const queryDto = listUsersQuerySchema.parse(req.query);
    const result = await container.user.listUsersHandler.execute(queryDto);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = userIdParamsSchema.parse(req.params);
    const result = await container.user.getUserByIdHandler.execute({ id: userId });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const bodyDto = createUserBodySchema.parse(req.body);
    const result = await container.user.createUserHandler.execute(bodyDto);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = userIdParamsSchema.parse(req.params);
    const patchDto = updateUserBodySchema.parse(req.body); 
    const result = await container.user.updateUserHandler.execute({ id: userId, patch: patchDto });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = userIdParamsSchema.parse(req.params);
    await container.user.deleteUserHandler.execute({ id: userId });
    res.status(204).send();
  } catch (err) { next(err); }
}
