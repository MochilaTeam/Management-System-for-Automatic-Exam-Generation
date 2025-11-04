import { BaseCommand } from "../../../../shared/domain/base_use_case";
import type { IUserRepository } from "../../../domain/ports/IUserRepository";

type Input  = { id: string };
type Output = { success: true };

export class DeleteUserCommand extends BaseCommand<Input, Output> {
  constructor(private readonly repo: IUserRepository) { super(); }

  protected async executeBusinessLogic(input: Input): Promise<Output> {
    await this.repo.deleteById(input.id);
    return { success: true };
  }
}
