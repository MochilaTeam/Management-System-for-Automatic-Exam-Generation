import { Response } from 'express';

import { ValidatedReq } from '../../../../core/middlewares/requestValidator';
import { HttpStatus } from '../../../../shared/enums/httpStatusEnum';
import { LoginBodySchema } from '../../schemas/loginSchemas';
import { makeLoginCommand } from '../dependencies';

export async function login(req: ValidatedReq<LoginBodySchema>, res: Response) {
    const reqSchema: LoginBodySchema = req.body;
    const loginCommand = makeLoginCommand();
    const result = await loginCommand.execute(reqSchema);

    return res.status(HttpStatus.OK).json(result);
}
