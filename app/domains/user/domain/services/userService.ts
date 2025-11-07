import { BaseDomainService } from "../../../../shared/domain/base_service";
import type { IUserRepository} from "../ports/IUserRepository";

type Deps = { repo: IUserRepository; hasher?: { hash: (p: string) => Promise<string> } };

export class UserService extends BaseDomainService {
  public readonly repo: IUserRepository;
  private readonly hasher?: Deps["hasher"];

  constructor({ repo, hasher }: Deps) {
    super();
    this.repo = repo;
    this.hasher = hasher;
  }

  async ensureEmailIsUnique(email: string) {
    if (await this.repo.existsByEmail(email)) {
      this.raiseBusinessRuleError("create_user", "EMAIL_ALREADY_REGISTERED");
    }
  }

}
