import { NextFunction,Request,Response } from "express";
import {
  createStudentCommandSchema,
  listStudentsQuerySchema,
  studentIdParamsSchema,
  updateStudentCommandSchema,
} from "../../schemas/studentSchema";
import {
  makeCreateStudentCommand,
  makeDeleteStudentCommand,
  makeGetStudentByIdQuery,
  makeListStudentsQuery,
  makeUpdateStudentCommand,
} from "../../../../core/dependencies/user/studentDependencies";

export async function listStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = listStudentsQuerySchema.parse(req.query);
    const result = await makeListStudentsQuery().execute(dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStudentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = studentIdParamsSchema.parse(req.params);
    const result = await makeGetStudentByIdQuery().execute({ studentId });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createStudentCommandSchema.parse(req.body);
    const result = await makeCreateStudentCommand().execute(body);
    res.status(201).json(result);
  } catch (err) {next(err);}
}

export async function updateStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = studentIdParamsSchema.parse(req.params);
    const patch = updateStudentCommandSchema.parse(req.body);
    const result = await makeUpdateStudentCommand().execute({ id: studentId, patch });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = studentIdParamsSchema.parse(req.params);
    await makeDeleteStudentCommand().execute({ studentId });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
