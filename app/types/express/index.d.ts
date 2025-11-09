import { Roles } from '../../shared/enums/rolesEnum';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                roles?: Roles[];
            };
        }
    }
}

export {};
