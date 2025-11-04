import { BaseQuery } from "../../../../shared/domain/base_use_case";
import type { IUserRepository } from "../../../domain/ports/IUserRepository";

type Input  = { id: string };
type Output = { data: { id: string; name: string; email: string; role: string; active: boolean } };

export class GetUserByIdQuery extends BaseQuery<Input, Output> {
  constructor(private readonly repo: IUserRepository) { super(); }

  protected async executeBusinessLogic(input: Input): Promise<Output> {
    const u = await this.repo.getById(input.id);
    if (!u) this.raiseNotFoundError("get_user", "USER_NOT_FOUND");
    return { data: { id: u!.id, name: u!.name, email: u!.email, role: u!.role, active: u!.active } };
  }
}
