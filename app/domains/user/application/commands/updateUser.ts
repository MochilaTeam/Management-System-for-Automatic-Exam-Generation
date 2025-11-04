import { BaseCommand } from "../../../../shared/domain/base_use_case";
import type { IUserRepository } from "../../../domain/ports/IUserRepository";

type Input  = { id: string; patch: { name?: string; role?: any; active?: boolean } };
type Output = { data: { id: string; name: string; email: string; role: string; active: boolean } };

export class UpdateUserCommand extends BaseCommand<Input, Output> {
  constructor(private readonly repo: IUserRepository) { super(); }

  protected async executeBusinessLogic(input: Input): Promise<Output> {
    const updated = await this.repo.updatePartial(input.id, input.patch);
    return { data: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, active: updated.active } };
  }
}
