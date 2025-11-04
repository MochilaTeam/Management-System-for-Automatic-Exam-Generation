import { PaginationSchema } from "../../../../shared/domain/base_response";
import { BaseQuery } from "../../../../shared/domain/base_use_case";
import { UserService } from "../../domain/services/userService";
import { ListUsers, UserRead } from "../../schemas/userSchema";

export class ListUsersQuery extends BaseQuery<ListUsers, PaginationSchema<UserRead>> {
  constructor(private readonly serv: UserService) { super(); }

  protected async executeBusinessLogic(input: ListUsers): Promise<PaginationSchema<UserRead>> {
    const {items, total} = await this.serv.repo.get_multi(input);


      data: items.map(i => ({ id: i.id, name: i.name, email: i.email, role: i.role, active: i.active })),
      meta: { limit: input.limit, offset: input.offset, total },
      
  }
}
