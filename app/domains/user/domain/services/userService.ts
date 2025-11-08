import { IUserRepository } from "../ports/IUserRepository";
import { Roles } from "../../../../shared/enums/rolesEnum";
import {
  type CreateUserCommand,
  type UserCreate,
  type UserRead,
  type UserUpdate,
} from "../../schemas/userSchema";
import { getHasher, type Hasher } from "../../../../core/security/hasher";

type Deps = {
  repo: IUserRepository;
  hasher?: Hasher;
};

export class UserService {
  public readonly repo: IUserRepository; // 👈 visible para queries
  private readonly hasher: Hasher;

  constructor(deps: Deps) {
    this.repo = deps.repo;                 // 👈 asigna la instancia
    this.hasher = deps.hasher ?? getHasher();
  }

  private normEmail(email: string) {
    return email.trim().toLowerCase();
  }

  async create(input: CreateUserCommand): Promise<UserRead> {
    const name = input.name.trim();
    const email = this.normEmail(input.email);

    const taken = await this.repo.existsBy({ email }); // 👈 usa this.repo
    if (taken) throw new Error("EMAIL_ALREADY_IN_USE");

    const passwordHash = await this.hasher.hash(input.password);
    const dto: UserCreate = { name, email, passwordHash };
    return this.repo.create(dto);
  }

  async update(
    id: string,
    patch: Partial<{ name: string; email: string; password: string; role: Roles; passwordHash?: string }>
  ): Promise<UserRead | null> {
    const current = await this.repo.get_by_id(id);
    if (!current) return null;

    const dto: UserUpdate = {} as any;

    if (patch.name != null) dto.name = patch.name.trim();
    if (patch.email != null) {
      const newEmail = this.normEmail(patch.email);
      if (newEmail !== current.email) {
        const taken = await this.repo.existsBy({ email: newEmail });
        if (taken) throw new Error("EMAIL_ALREADY_IN_USE");
      }
      dto.email = newEmail;
    }
    if (patch.password != null) dto.passwordHash = await this.hasher.hash(patch.password);
    else if (patch.passwordHash != null) dto.passwordHash = patch.passwordHash;

    return this.repo.update(id, dto);
  }

  async get_by_id(id: string): Promise<UserRead | null> {
    return this.repo.get_by_id(id);
  }
}
