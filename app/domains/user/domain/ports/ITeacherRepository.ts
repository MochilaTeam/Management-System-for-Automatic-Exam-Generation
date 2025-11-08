import { Roles } from "../../../../shared/enums/rolesEnum";
import { TeacherCreate, TeacherRead, TeacherUpdate } from "../../schemas/teacherSchema";

export type TeacherFilters = {
  role?: Roles;
  active?: boolean;
  q?: string;        
  email?: string;    
};

export type Sort = {
  field: "createdAt" | "name" | "email";
  dir: "asc" | "desc";
};

export type ListTeachersCriteria = {
  offset?: number;      
  limit?: number;       
  filters?: TeacherFilters;
  sort?: Sort;
};

 //Resultado de paginación genérico
export type Page<T> = { items: T[]; total: number };

export interface ITeacherRepository {
  paginate(criteria: ListTeachersCriteria): Promise<Page<TeacherRead>>; 
  list(criteria: ListTeachersCriteria): Promise<TeacherRead[]>;         

  get_by_id(id: string): Promise<TeacherRead | null>;
  existsBy(filters: TeacherFilters): Promise<boolean>;

  create(data: TeacherCreate): Promise<TeacherRead>;
  update(id: string, data: TeacherUpdate): Promise<TeacherRead | null>;
  deleteById(id: string): Promise<boolean>;
}
