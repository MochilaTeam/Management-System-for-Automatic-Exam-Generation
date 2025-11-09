import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { UserService } from '../../domain/services/userService';
import { ListUsers, UserRead } from '../../schemas/userSchema';

export class ListUsersQuery extends BaseQuery<ListUsers, PaginatedSchema<UserRead>> {
    constructor(private readonly serv: UserService) {
        super();
    }

    protected async executeBusinessLogic(input: ListUsers): Promise<PaginatedSchema<UserRead>> {
        return this.serv.paginate(input);
    }
}
