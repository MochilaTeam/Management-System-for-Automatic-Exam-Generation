import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { UserService } from '../../domain/services/userService';
import { CreateUserCommandSchema, UserRead } from '../../schemas/userSchema';

export class CreateUserCommand extends BaseCommand<
    CreateUserCommandSchema,
    RetrieveOneSchema<UserRead>
> {
    constructor(private readonly svc: UserService) {
        super();
    }

    protected async executeBusinessLogic(
        input: CreateUserCommandSchema,
    ): Promise<RetrieveOneSchema<UserRead>> {
        const user = await this.svc.create(input);
        return new RetrieveOneSchema(user, 'User created', true);
    }
}
