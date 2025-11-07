import { BaseQuery } from "../../../../shared/domain/base_use_case";
import { UserService } from "../../domain/services/userService";
import { ListUsers, ListUsersResponse, listUsersResponseSchema, UserRead } from "../../schemas/userSchema";

export class ListUsersQuery extends BaseQuery<ListUsers, ListUsersResponse> {
  constructor(private readonly serv: UserService){ super();}

  protected async executeBusinessLogic(input: ListUsers): Promise<ListUsersResponse>{
    const criteria ={
      offset: input.offset,
      limit: input.limit,
      filters: {
        role: input.role,
        active: input.active,
        q: input.filter,
        email: input.email
      }
    }
    const {items, total} = await this.serv.repo.paginate(criteria);

    const response = {
      data: items,
      meta: { limit: input.limit, offset: input.offset, total },
    };

    return listUsersResponseSchema.parse(response);
  }
}
