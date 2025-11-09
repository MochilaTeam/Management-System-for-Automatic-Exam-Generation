import { Roles } from "../../../../shared/enums/rolesEnum";
import { UserAuth, UserCreate, UserRead, UserUpdate } from "../../schemas/userSchema";

export type UserFilters = {
  role?: Roles;
  active?: boolean;
  q?: string;        
  email?: string;    
};

export type Sort = {
  field: "createdAt" | "name" | "email";
  dir: "asc" | "desc";
};

export type ListUsersCriteria = {
  offset?: number;      
  limit?: number;       
  filters?: UserFilters;
  sort?: Sort;
};

 //Resultado de paginación genérico
export type Page<T> = { items: T[]; total: number };

export interface IUserRepository {
  paginate(criteria: ListUsersCriteria): Promise<Page<UserRead>>; 
  list(criteria: ListUsersCriteria): Promise<UserRead[]>;         

  get_by_id(id: string): Promise<UserRead | null>;
  existsBy(filters: UserFilters): Promise<boolean>;
  findByEmailWithPassword(email: string): Promise<UserAuth | null>;

  create(data: UserCreate): Promise<UserRead>;
  update(id: string, data: UserUpdate): Promise<UserRead | null>;
  deleteById(id: string): Promise<boolean>;
}
