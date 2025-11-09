import { Response } from 'express';

import { makeLoginCommand } from '../../../../core/dependencies/user/userDependencies';
import { ValidatedReq } from '../../../../core/middlewares/requestValidator';
import { HttpStatus } from '../../../../shared/enums/httpStatusEnum';
import { LoginBodySchema } from '../../schemas/login';

export async function login(req: ValidatedReq<LoginBodySchema>, res: Response) {
    const reqSchema: LoginBodySchema = req.body;
    const loginCommand = makeLoginCommand();
    const result = await loginCommand.execute(reqSchema);

    return res.status(HttpStatus.OK).json(result);
}
