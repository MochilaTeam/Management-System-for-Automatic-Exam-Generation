// domains/user/application/commands/CreateUser/CreateUserCommand.ts
import { BaseCommand } from "../../../../shared/domain/base_use_case";
import type { IUserRepository } from "../../../domain/ports/IUserRepository";
import { UserService } from "../../../domain/services/UserService";
import { randomUUID } from "crypto";

type Input  = { name: string; email: string; role: any; password?: string };
type Output = { data: { id: string; name: string; email: string; role: string; active: boolean } };

export class CreateUserCommand extends BaseCommand<Input, Output> {
  constructor(private readonly repo: IUserRepository, private readonly svc: UserService) { super(); }

  protected async executeBusinessLogic(input: Input): Promise<Output> {
    await this.svc.ensureEmailIsUnique(input.email);
    const id = randomUUID();
    const passwordHash = input.password ? "TODO_HASH" : undefined; // integra tu hasher
    const u = await this.repo.create({ id, name: input.name, email: input.email, role: input.role, passwordHash, active: true });
    return { data: await this.svc.toPublic(u) };
  }
}
