import { Roles } from "../../../../shared/enums/rolesEnum";
import { StudentCreate, StudentRead, StudentUpdate } from "../../schemas/studentSchema";
import { Page } from "./IUserRepository";

export type StudentFilters = {
  userId?: string;
  role?: Roles;
  active?: boolean;
  filter?: string;
  email?: string;
};

export type Sort = {
  field: "createdAt" | "name" | "email";
  dir: "asc" | "desc";
};

export type ListStudentsCriteria = {
  offset?: number;      
  limit?: number;       
  filters?: StudentFilters;
  sort?: Sort;
};

export interface IStudentRepository {
  get_by_id(id: string): Promise<StudentRead | null>;
  list(criteria: ListStudentsCriteria): Promise<StudentRead[]>;
  paginate(criteria: ListStudentsCriteria): Promise<Page<StudentRead>>;

  existsBy(filters: { userId?: string }): Promise<boolean>;

  createProfile(input: { userId: string; age: number; course: number }): Promise<StudentRead>;
  updateProfile(id: string, patch: { age?: number; course?: number }): Promise<StudentRead | null>;
  deleteById(id: string): Promise<boolean>;
}
