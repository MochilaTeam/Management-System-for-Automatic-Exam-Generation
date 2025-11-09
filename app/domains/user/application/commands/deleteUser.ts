import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { UserService } from '../../domain/services/userService';
import { UserIdParams } from '../../schemas/userSchema';

export class DeleteUserCommand extends BaseCommand<UserIdParams, void> {
    constructor(private readonly svc: UserService) {
        super();
    }

    protected async executeBusinessLogic(input: UserIdParams): Promise<void> {
        const deleted = await this.svc.deleteById(input.userId);
        if (!deleted) {
            throw new NotFoundError({ message: 'USER_NOT_FOUND' });
        }
    }
}
