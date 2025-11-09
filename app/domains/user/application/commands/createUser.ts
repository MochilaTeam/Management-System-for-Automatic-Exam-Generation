import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { UserService } from '../../domain/services/userService';
import { CreateUserCommandSchema, UserRead } from '../../schemas/userSchema';

export class CreateUserCommand extends BaseCommand<CreateUserCommandSchema, UserRead> {
    constructor(private readonly svc: UserService) {
        super();
    }

    protected async executeBusinessLogic(input: CreateUserCommandSchema): Promise<UserRead> {
        return this.svc.create(input);
    }
}
