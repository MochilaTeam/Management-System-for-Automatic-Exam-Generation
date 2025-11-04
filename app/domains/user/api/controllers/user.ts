// domains/user/api/controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  listUsersQuerySchema,
  userIdParamsSchema,
  createUserBodySchema,
  updateUserBodySchema,
} from "../schemas/user";
import {
  makeListUsersQuery,
  makeGetUserByIdQuery,
  makeCreateUserCommand,
  makeUpdateUserCommand,
  makeDeleteUserCommand,
} from "../../application/dependencies";      // ← tus factories con cache
import { getCore } from "../../../core/dependencies/core"; // ← helper con deps core (logger, models, etc.)

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = listUsersQuerySchema.parse(req.query);
    const result = await makeListUsersQuery(getCore()).execute(dto);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = userIdParamsSchema.parse(req.params);
    const result = await makeGetUserByIdQuery(getCore()).execute({ id: userId });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createUserBodySchema.parse(req.body);
    const result = await makeCreateUserCommand(getCore()).execute(body);
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = userIdParamsSchema.parse(req.params);
    const patch = updateUserBodySchema.parse(req.body);
    const result = await makeUpdateUserCommand(getCore()).execute({ id: userId, patch });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = userIdParamsSchema.parse(req.params);
    await makeDeleteUserCommand(getCore()).execute({ id: userId });
    res.status(204).send();
  } catch (err) { next(err); }
}
