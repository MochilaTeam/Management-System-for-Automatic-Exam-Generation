import type { Roles } from "../../../../shared/enums/rolesEnum";

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
  list(criteria: ListUsersCriteria): Promise<{ items: UserEntity[]; total: number }>;
  getById(id: string): Promise<UserEntity | null>;
  existsByEmail(email: string): Promise<boolean>;
  create(data: { id: string; name: string; email: string; role: Roles; passwordHash?: string; active?: boolean }): Promise<UserEntity>;
  updatePartial(id: string, patch: Partial<Pick<UserEntity, "name" | "role" | "active">>): Promise<UserEntity>;
  deleteById(id: string): Promise<void>; 
}
