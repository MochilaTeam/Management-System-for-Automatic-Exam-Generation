import { Page } from './IUserRepository';
import { Roles } from '../../../../shared/enums/rolesEnum';
import { StudentRead } from '../../schemas/studentSchema';

export type StudentFilters = {
    userId?: string;
    role?: Roles;
    active?: boolean;
    filter?: string;
    email?: string;
    course?: string;
};

export type Sort = {
    field: 'createdAt' | 'name' | 'email';
    dir: 'asc' | 'desc';
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

    createProfile(input: { userId: string; age: number; course: string }): Promise<StudentRead>;
    updateProfile(
        id: string,
        patch: { age?: number; course?: string },
    ): Promise<StudentRead | null>;
    deleteById(id: string): Promise<boolean>;
}
