import jwt from 'jsonwebtoken';

import { get_jwt_config, JwtConfig } from '../../../../core/config/jwt';
import { SystemLogger } from '../../../../core/logging/logger';
import Student from '../../../../infrastructure/user/models/Student';
import Teacher from '../../../../infrastructure/user/models/Teacher';
import { BaseDomainService } from '../../../../shared/domain/base_service';
import { Roles } from '../../../../shared/enums/rolesEnum';
import { UnauthorizedError } from '../../../../shared/exceptions/domainErrors';
import { LoginBodySchema } from '../../schemas/loginSchemas';
import { UserReadSchema } from '../../schemas/userSchemas';
import { UserEntity } from '../entities/userEntity';
import { IUserRepository } from '../ports/IUserRepository';

export class UserService extends BaseDomainService {
    protected user_repository: IUserRepository;

    constructor(logger: SystemLogger, user_repository: IUserRepository) {
        (super(logger), (this.user_repository = user_repository));
    }

    async loginUser({ email, password }: LoginBodySchema): Promise<UserReadSchema> {
        this.logOperationStart('login');

        const user: UserEntity | null = await this.user_repository.get_user_by_email(email);
        //TODO: AQUI SE PUDIERA OBTENER USER ASI User.findOne.get_one({where: email})
        if (!user) {
            const err = new UnauthorizedError({
                message: 'Invalid credentials',
            });
            this.logOperationError('login', err);
            throw err;
        }

        const isPasswordValid = this.verifyPassword(password, user.passwordHash);
        if (!isPasswordValid) {
            const err = new UnauthorizedError({
                message: 'Invalid credentials',
            });
            this.logOperationError('login', err);
            throw err;
        }

        const roles: Roles[] = await this.resolveRoles(user.id);
        const jwtConfig: JwtConfig = get_jwt_config();
        const accessTokenPayload = { sub: user.id, roles };
        const accessToken = jwt.sign(accessTokenPayload, jwtConfig.accessSecret, {
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience,
            expiresIn: jwtConfig.expiresIn,
        });

        return new UserReadSchema(user.id, roles, accessToken);
    }

    private async resolveRoles(userId: string): Promise<Roles[]> {
        const roles: Roles[] = [];

        const [student, teacher] = await Promise.all([
            Student.findOne({ where: { userId } }),
            Teacher.findOne({ where: { userId } }),
        ]);

        if (student) {
            roles.push(Roles.STUDENT);
        }

        if (teacher) {
            roles.push(Roles.TEACHER);

            if (teacher.hasRoleSubjectLeader) {
                roles.push(Roles.SUBJECT_LEADER);
            }

            if (teacher.hasRoleExaminer) {
                roles.push(Roles.EXAMINER);
            }
        }
        //TODO: ADMIN?
        return roles;
    }

    private verifyPassword(plainPassword: string, storedHash: string): boolean {
        if (!storedHash) return false;

        //Example with argon2
        // try {
        //     return await argon2.verify(storedHash, plain, { type: argon2id });
        // } catch {
        //     return false;
        // }
        return true; //TODO: borrar esto despues
    }
}
