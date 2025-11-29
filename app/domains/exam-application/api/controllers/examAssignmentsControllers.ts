import { NextFunction } from 'express';
import { Response } from 'express';

import {
    makeCreateExamAssignmentCommand,
    makeListStudentExamsQuery,
} from '../../../../core/dependencies/exam-application/examAssignment';
import { UnauthorizedError } from '../../../../shared/exceptions/domainErrors';
import { AuthenticatedRequest } from '../../../../shared/types/http/AuthenticatedRequest';
import {
    createExamAssignmentCommandSchema,
    examIdParamsSchema,
    listStudentExamsQuerySchema,
} from '../../schemas/examAssignmentSchema';

export async function createExamAssignment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const { examId } = examIdParamsSchema.parse(req.params);
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedError({ message: 'No se encontró el id del usuario' });
        }
        const command_schema = createExamAssignmentCommandSchema.parse({
            ...req.body,
            examId,
            currentUserId,
        });
        const result = await makeCreateExamAssignmentCommand().execute(command_schema);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function listStudentExams(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            throw new UnauthorizedError({ message: 'No se encontró el id del usuario' });
        }
        const result = await makeListStudentExamsQuery().execute(
            listStudentExamsQuerySchema.parse({
                ...req.query,
                currentUserId,
            }),
        );
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}
