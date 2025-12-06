import { Roles } from '../../../../shared/enums/rolesEnum';
import { TeacherCreate, TeacherRead, TeacherUpdate } from '../../schemas/teacherSchema';

export type TeacherFilters = {
    userId?: string;
    role?: Roles;
    active?: boolean;
    filter?: string;
    email?: string;
    subjectLeader?: boolean;
    examiner?: boolean;
};

export type Sort = {
    field: 'createdAt' | 'name' | 'email';
    dir: 'asc' | 'desc';
};

export type ListTeachersCriteria = {
    offset?: number;
    limit?: number;
    filters?: TeacherFilters;
    sort?: Sort;
};

export type Page<T> = { items: T[]; total: number };

export interface ITeacherRepository {
    get_by_id(id: string): Promise<TeacherRead | null>;
    list(criteria: ListTeachersCriteria): Promise<TeacherRead[]>;
    paginate(criteria: ListTeachersCriteria): Promise<Page<TeacherRead>>;
    findByIds(ids: string[]): Promise<TeacherRead[]>;

    existsBy(filters: { userId?: string }): Promise<boolean>;

    createProfile(input: TeacherCreate): Promise<TeacherRead>;
    updateProfile(id: string, patch: TeacherUpdate): Promise<TeacherRead | null>;
    deleteById(id: string): Promise<boolean>;
}
