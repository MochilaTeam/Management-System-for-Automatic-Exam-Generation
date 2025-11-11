import { NextFunction, Request, Response } from "express";
import {
  makeCreateSubjectCommand,
  makeDeleteSubjectCommand,
  makeGetSubjectByIdQuery,
  makeListSubjectsQuery,
  makeUpdateSubjectCommand,
} from "../../../../core/dependencies/question-bank/subjectDependencies";
import {
  createSubjectBodySchema,
  listSubjectsQuerySchema,
  updateSubjectBodySchema,
  subjectIdParamsSchema,
} from "../../schemas/subjectSchema";

export async function listSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = listSubjectsQuerySchema.parse(req.query);
    const result = await makeListSubjectsQuery().execute(dto);
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function getSubjectById(req: Request, res: Response, next: NextFunction) {
  try {
    const { subjectId } = subjectIdParamsSchema.parse(req.params);
    const result = await makeGetSubjectByIdQuery().execute({ subjectId });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function createSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createSubjectBodySchema.parse(req.body);
    // ya NO sacamos leader del usuario; se crea sin líder:
    const result = await makeCreateSubjectCommand().execute({ body });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function updateSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const { subjectId } = subjectIdParamsSchema.parse(req.params);
    const patch = updateSubjectBodySchema.parse(req.body);
    const result = await makeUpdateSubjectCommand().execute({ subjectId, patch });
    res.status(200).json(result);
  } catch (err) { next(err); }
}

export async function deleteSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const { subjectId } = subjectIdParamsSchema.parse(req.params);
    await makeDeleteSubjectCommand().execute({ subjectId });
    res.status(204).send();
  } catch (err) { next(err); }
}
