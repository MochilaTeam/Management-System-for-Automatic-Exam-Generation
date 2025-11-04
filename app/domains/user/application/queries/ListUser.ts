import { BaseQuery } from "../../../../shared/domain/base_use_case";
import type { IUserRepository, ListUsersCriteria } from "../../../domain/ports/IUserRepository";

type Input  = ListUsersCriteria;  // puedes mapear desde tus schemas Zod
type Output = { data: Array<{ id: string; name: string; email: string; role: string; active: boolean }>; meta: { limit: number; offset: number; total: number } };

export class ListUsersQuery extends BaseQuery<Input, Output> {
  constructor(private readonly repo: IUserRepository) { super(); }

  protected async executeBusinessLogic(input: Input): Promise<Output> {
    const { items, total } = await this.repo.list(input);
    return {
      data: items.map(i => ({ id: i.id, name: i.name, email: i.email, role: i.role, active: i.active })),
      meta: { limit: input.limit, offset: input.offset, total },
    };
  }
}
