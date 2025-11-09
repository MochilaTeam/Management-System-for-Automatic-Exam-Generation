import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { UserService } from '../../domain/services/userService';
import { ListUsers, ListUsersResponse, listUsersResponseSchema } from '../../schemas/userSchema';

export class ListUsersQuery extends BaseQuery<ListUsers, ListUsersResponse> {
    constructor(private readonly serv: UserService) {
        super();
    }

    protected async executeBusinessLogic(input: ListUsers): Promise<ListUsersResponse> {
        const response = await this.serv.paginate(input);
        return listUsersResponseSchema.parse(response);
    }
}
