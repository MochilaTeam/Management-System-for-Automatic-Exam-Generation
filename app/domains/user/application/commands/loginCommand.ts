import { RetrieveOneSchema } from "../../../../shared/domain/base_response";
import { BaseCommand } from "../../../../shared/domain/base_use_case";
import { LoginBodySchema } from "../../schemas/login";
import { UserRead } from "../../schemas/userSchema";
import { UserService } from "../../domain/services/userService";

export class LoginCommand extends BaseCommand<LoginBodySchema, RetrieveOneSchema<UserRead>> {
  constructor(private readonly userService: UserService) {
    super();
  }

  protected async executeBusinessLogic(input: LoginBodySchema): Promise<RetrieveOneSchema<UserRead>> {
    const user = await this.userService.loginUser(input);
    return new RetrieveOneSchema(user, "Login successful", true);
  }
}
