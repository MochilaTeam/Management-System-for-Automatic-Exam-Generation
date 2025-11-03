import { UserEntity } from '../entities/userEntity';

export interface IUserRepository {
    get_user_by_email(email: string): Promise<UserEntity | null>;
}
