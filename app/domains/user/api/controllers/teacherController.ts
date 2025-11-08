import { NextFunction,Request,Response } from "express";
import { createTeacherCommandSchema, listTeachersQuerySchema, updateTeacherCommandSchema } from "../../schemas/teacherSchema";
import { userIdParamsSchema } from "../../schemas/userSchema";
import { makeCreateTeacherCommand, makeDeleteTeacherCommand, makeGetTeacherByIdQuery, makeListTeachersQuery, makeUpdateTeacherCommand } from "../../../../core/dependencies/user/teacherDependencies";


export async function listTeachers(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = listTeachersQuerySchema.parse(req.query);
    const query = await makeListTeachersQuery();
    const result = query.execute(dto) 
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function getTeacherById(req: Request, res: Response, next: NextFunction) {
  try {
    const {userId} = userIdParamsSchema.parse(req.params); 
    const result = await makeGetTeacherByIdQuery().execute({userId});
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function createTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createTeacherCommandSchema.parse(req.body);
    const result = await makeCreateTeacherCommand().execute(body);
    res.status(201).json(result);
  } catch (err) {next(err);}
}

export async function updateTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = userIdParamsSchema.parse(req.params);
    const patch = updateTeacherCommandSchema.parse(req.body);
    const result = await makeUpdateTeacherCommand().execute({ id: userId, patch });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function deleteTeacher(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = userIdParamsSchema.parse(req.params);
    await makeDeleteTeacherCommand().execute({ id: userId });
    res.status(204).send();
  } catch (err) { next(err); }
}
