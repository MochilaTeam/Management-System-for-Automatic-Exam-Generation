import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { UserService } from '../../domain/services/userService';
import { UpdateUserCommandSchema, UserRead } from '../../schemas/userSchema';

type UpdateUserInput = {
    userId: string;
    patch: UpdateUserCommandSchema;
};

export class UpdateUserCommand extends BaseCommand<UpdateUserInput, RetrieveOneSchema<UserRead>> {
    constructor(private readonly svc: UserService) {
        super();
    }

    protected async executeBusinessLogic(
        input: UpdateUserInput,
    ): Promise<RetrieveOneSchema<UserRead>> {
        const updated = await this.svc.update(input.userId, input.patch);
        if (!updated) {
            throw new NotFoundError({ message: 'USER_NOT_FOUND' });
        }
        return new RetrieveOneSchema(updated, 'User updated', true);
    }
}
