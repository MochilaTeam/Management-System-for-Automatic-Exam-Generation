import { BaseQuery } from "../../../../shared/domain/base_use_case";
import { UserService } from "../../domain/services/userService";
import { NotFoundError } from "../../../../shared/exceptions/domainErrors";
import { UserIdParams, UserRead } from "../../schemas/userSchema";
import { RetrieveOneSchema } from "../../../../shared/domain/base_response";


export class GetUserByIdQuery extends BaseQuery<UserIdParams, RetrieveOneSchema<UserRead>> {
  constructor(private readonly serv: UserService) { super(); }

  protected async executeBusinessLogic(input: UserIdParams): Promise<RetrieveOneSchema<UserRead>> {
    const u = await this.serv.repo.get_by_id(input.userId) ;
    if (!u) throw new NotFoundError({message:"User not found"});
    return new RetrieveOneSchema(u)
  }
}
