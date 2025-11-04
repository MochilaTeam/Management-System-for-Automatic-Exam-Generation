import type { Roles } from "../../../../shared/enums/rolesEnum";
import { UserRead } from "../../schemas/userSchema";

export type ListUsersCriteria = {
  limit: number;
  offset: number;
  filters?: { role?: Roles; q?: string; active?: boolean };
  sort?: { field: "createdAt" | "name" | "email"; dir: "asc" | "desc" };
};

export type UserEntity = {
  id: string;
  name: string;
  email: string;
  role: Roles;
  active: boolean;
};

export interface IUserRepository {
  get_multi(criteria: ListUsersCriteria): Promise<{ items: UserEntity[]; total: number }>;
  get_by_id(id: string): Promise<UserRead | null>;
  exists(email: string): Promise<boolean>;
  create(data: { id: string; name: string; email: string; role: Roles; passwordHash?: string; active?: boolean }): Promise<UserEntity>;
  updatePartial(id: string, patch: Partial<Pick<UserEntity, "name" | "role" | "active">>): Promise<UserEntity>;
  deleteById(id: string): Promise<void>; 
}
