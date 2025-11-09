import { Request } from 'express';

import { Roles } from '../../enums/rolesEnum';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        roles?: Roles[];
    };
}
