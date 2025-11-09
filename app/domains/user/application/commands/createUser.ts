import { BaseCommand } from "../../../../shared/domain/base_use_case";
import { randomUUID } from "crypto";
import { IUserRepository } from "../../domain/ports/IUserRepository";
import { UserService } from "../../domain/services/userService";
import { CreateUserCommandSchema, UserRead } from "../../schemas/userSchema";

export class CreateUserCommand extends BaseCommand<CreateUserCommandSchema, UserRead> {
  constructor(private readonly repo: IUserRepository, private readonly svc: UserService) { super(); }

  protected async executeBusinessLogic(input: CreateUserCommandSchema): Promise<UserRead> {
    const resp = await this.svc.create(input)
    return resp
  }
}
