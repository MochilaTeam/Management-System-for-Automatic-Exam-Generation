import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { UserService } from '../../domain/services/userService';
import { ListUsers, UserRead } from '../../schemas/userSchema';

export class ListUsersQuery extends BaseQuery<ListUsers, PaginatedSchema<UserRead>> {
    constructor(private readonly serv: UserService) {
        super();
    }

    protected async executeBusinessLogic(input: ListUsers): Promise<PaginatedSchema<UserRead>> {
        const limit = input.limit ?? 20;
        const offset = input.offset ?? 0;
        const { list, total } = await this.serv.paginate(input);
        return new PaginatedSchema(list, { limit, offset, total });
    }
}
