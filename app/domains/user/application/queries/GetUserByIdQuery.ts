import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { UserService } from '../../domain/services/userService';
import { UserIdParams, UserRead } from '../../schemas/userSchema';

export class GetUserByIdQuery extends BaseQuery<UserIdParams, RetrieveOneSchema<UserRead>> {
    constructor(private readonly serv: UserService) {
        super();
    }

    protected async executeBusinessLogic(
        input: UserIdParams,
    ): Promise<RetrieveOneSchema<UserRead>> {
        const u = await this.serv.repo.get_by_id(input.userId);
        if (!u) throw new NotFoundError({ message: 'User not found' });
        return new RetrieveOneSchema(u);
    }
}
