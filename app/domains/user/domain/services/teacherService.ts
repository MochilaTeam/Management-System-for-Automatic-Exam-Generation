import { BaseDomainService } from "../../../../shared/domain/base_service";
import { ITeacherRepository } from "../ports/ITeacherRepository";

type Deps = { repo: ITeacherRepository; hasher?: { hash: (p: string) => Promise<string> } };

export class teacherService extends BaseDomainService {
  public readonly repo: ITeacherRepository;
  private readonly hasher?: Deps["hasher"];

  constructor({ repo, hasher }: Deps) {
    super();
    this.repo = repo;
    this.hasher = hasher;
  }

}
