import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { UserService } from '../../domain/services/userService';
import { LoginBodySchema } from '../../schemas/loginSchemas';
import { UserReadSchema } from '../../schemas/userSchemas';

export class LoginCommand extends BaseCommand<LoginBodySchema, RetrieveOneSchema<UserReadSchema>> {
    constructor(private readonly user_service: UserService) {
        super();
        this.user_service = user_service;
    }

    protected async executeBusinessLogic(
        input: LoginBodySchema,
    ): Promise<RetrieveOneSchema<UserReadSchema>> {
        const user: UserReadSchema = await this.user_service.loginUser(input);
        return new RetrieveOneSchema(user, 'Login successfull', true);
    }
}
