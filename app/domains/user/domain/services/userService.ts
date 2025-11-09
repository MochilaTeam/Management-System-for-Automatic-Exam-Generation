import jwt from 'jsonwebtoken';

import { get_jwt_config } from '../../../../core/config/jwt';
import { getHasher, type Hasher } from '../../../../core/security/hasher';
import { Roles } from '../../../../shared/enums/rolesEnum';
import { UnauthorizedError } from '../../../../shared/exceptions/domainErrors';
import { LoginBodySchema } from '../../schemas/login';
import {
    CreateUserCommandSchema,
    type ListUsers,
    type UserCreate,
    type UserRead,
    type UserUpdate,
} from '../../schemas/userSchema';
import { IUserRepository, ListUsersCriteria } from '../ports/IUserRepository';

type Deps = {
    repo: IUserRepository;
    hasher?: Hasher;
};

export class UserService {
    public readonly repo: IUserRepository;
    private readonly hasher: Hasher;

    constructor(deps: Deps) {
        this.repo = deps.repo;
        this.hasher = deps.hasher ?? getHasher();
    }

    private normEmail(email: string) {
        return email.trim().toLowerCase();
    }

    async create(input: CreateUserCommandSchema): Promise<UserRead> {
        const name = input.name.trim();
        const email = this.normEmail(input.email);

        const taken = await this.repo.existsBy({ email });
        if (taken) throw new Error('EMAIL_ALREADY_IN_USE');

        const passwordHash = await this.hasher.hash(input.password);
        const dto: UserCreate = { name, email, passwordHash, role: input.role };
        const res: UserRead = await this.repo.create(dto);
        return res;
    }

    async paginate(criteria: ListUsers): Promise<{ list: UserRead[]; total: number }> {
        const limit = criteria.limit ?? 20;
        const offset = criteria.offset ?? 0;
        const active = criteria.active ?? true;
        const repoCriteria: ListUsersCriteria = {
            limit,
            offset,
            filters: {
                role: criteria.role,
                active,
                email: criteria.email,
                q: criteria.filter,
            },
        };

        const { items, total } = await this.repo.paginate(repoCriteria);
        return { list: items, total };
    }

    async update(
        id: string,
        patch: Partial<{ name: string; email: string; password: string; role: Roles }>,
    ): Promise<UserRead | null> {
        const current = await this.repo.get_by_id(id);
        if (!current) return null;

        const dto: Partial<UserUpdate> = {};

        if (patch.name != null) dto.name = patch.name.trim();
        if (patch.email != null) {
            const newEmail = this.normEmail(patch.email);
            if (newEmail !== current.email) {
                const taken = await this.repo.existsBy({ email: newEmail });
                if (taken) throw new Error('EMAIL_ALREADY_IN_USE');
            }
            dto.email = newEmail;
        }
        if (patch.password != null) dto.passwordHash = await this.hasher.hash(patch.password);
        if (patch.role != null) dto.role = patch.role;

        return this.repo.update(id, dto as UserUpdate);
    }

    async get_by_id(id: string): Promise<UserRead | null> {
        return this.repo.get_by_id(id);
    }

    async deleteById(id: string): Promise<boolean> {
        return this.repo.deleteById(id);
    }

    async loginUser(input: LoginBodySchema): Promise<{ user: UserRead; token: string }> {
        const email = this.normEmail(input.email);
        const user = await this.repo.findByEmailWithPassword(email);
        if (!user || !user.active) {
            throw new UnauthorizedError({ message: 'Invalid credentials' });
        }

        const passwordMatch = await this.hasher.compare(input.password, user.passwordHash);
        if (!passwordMatch) {
            throw new UnauthorizedError({ message: 'Invalid credentials' });
        }

        const safeUser = { id: user.id, role: user.role, email: user.email, name: user.name };
        const jwtConfig = get_jwt_config();
        const token = jwt.sign(
            {
                sub: safeUser.id,
                roles: [safeUser.role],
                email: safeUser.email,
            },
            jwtConfig.accessSecret,
            {
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience,
                expiresIn: jwtConfig.expiresIn,
            },
        );

        return { user: safeUser, token };
    }
}
