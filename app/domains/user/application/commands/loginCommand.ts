import { RetrieveOneSchema } from "../../../../shared/domain/base_response";
import { BaseCommand } from "../../../../shared/domain/base_use_case";
import { LoginBodySchema } from "../../schemas/login";
import { UserRead } from "../../schemas/userSchema";
import { UserService } from "../../domain/services/userService";

type LoginResult = { user: UserRead; token: string };

export class LoginCommand extends BaseCommand<LoginBodySchema, RetrieveOneSchema<LoginResult>> {
  constructor(private readonly userService: UserService) {
    super();
  }

  protected async executeBusinessLogic(input: LoginBodySchema): Promise<RetrieveOneSchema<LoginResult>> {
    const result = await this.userService.loginUser(input);
    return new RetrieveOneSchema(result, "Login successful", true);
  }
}
