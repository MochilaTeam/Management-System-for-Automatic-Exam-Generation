import { BaseDomainService } from "../../../../shared/domain/base_service";
import type { IUserRepository, UserEntity } from "../ports/IUserRepository";

type Deps = { repo: IUserRepository; logger: BaseDomainService["logger"]; hasher?: { hash: (p: string) => Promise<string> } };

export class UserService extends BaseDomainService {
  private readonly repo: IUserRepository;
  private readonly hasher?: Deps["hasher"];

  constructor({ repo, logger, hasher }: Deps) {
    super(logger);
    this.repo = repo;
    this.hasher = hasher;
  }

  async ensureEmailIsUnique(email: string) {
    if (await this.repo.existsByEmail(email)) {
      this.raiseBusinessRuleError("create_user", "EMAIL_ALREADY_REGISTERED");
    }
  }

  async toPublic(u: UserEntity) {
    return { id: u.id, name: u.name, email: u.email, role: u.role, active: u.active };
  }
}
