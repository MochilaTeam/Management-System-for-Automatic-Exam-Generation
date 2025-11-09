import { NextFunction, Request, Response } from 'express';

import {
    makeCreateTeacherCommand,
    makeDeleteTeacherCommand,
    makeGetTeacherByIdQuery,
    makeListTeachersQuery,
    makeUpdateTeacherCommand,
} from '../../../../core/dependencies/user/teacherDependencies';
import {
    createTeacherCommandSchema,
    listTeachersQuerySchema,
    teacherIdParamsSchema,
    updateTeacherCommandSchema,
} from '../../schemas/teacherSchema';

export async function listTeachers(req: Request, res: Response, next: NextFunction) {
    try {
        const dto = listTeachersQuerySchema.parse(req.query);
        const result = await makeListTeachersQuery().execute(dto);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getTeacherById(req: Request, res: Response, next: NextFunction) {
    try {
        const { teacherId } = teacherIdParamsSchema.parse(req.params);
        const result = await makeGetTeacherByIdQuery().execute({ teacherId });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function createTeacher(req: Request, res: Response, next: NextFunction) {
    try {
        const body = createTeacherCommandSchema.parse(req.body);
        const result = await makeCreateTeacherCommand().execute(body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function updateTeacher(req: Request, res: Response, next: NextFunction) {
    try {
        const { teacherId } = teacherIdParamsSchema.parse(req.params);
        const patch = updateTeacherCommandSchema.parse(req.body);
        const result = await makeUpdateTeacherCommand().execute({ id: teacherId, patch });
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function deleteTeacher(req: Request, res: Response, next: NextFunction) {
    try {
        const { teacherId } = teacherIdParamsSchema.parse(req.params);
        await makeDeleteTeacherCommand().execute({ teacherId });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}
