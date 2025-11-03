import { Roles } from '../../../shared/enums/rolesEnum';

export class UserReadSchema {
    protected id: string;
    protected roles: Roles[];
    protected accessToken: string;

    constructor(id: string, roles: Roles[], accessToken: string) {
        ((this.id = id), (this.roles = roles), (this.accessToken = accessToken));
    }
}
