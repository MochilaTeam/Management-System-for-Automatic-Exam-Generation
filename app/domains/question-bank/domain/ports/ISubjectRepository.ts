import {
    SubjectCreate,
    SubjectRead,
    SubjectUpdate,
    SubjectDetail,
} from '../../schemas/subjectSchema';

export type SubjectFilters = {
    q?: string;
    name?: string;
    program?: string;
    leadTeacherId?: string;
};

export type Sort = { field: 'createdAt' | 'name'; dir: 'asc' | 'desc' };

export type ListSubjectsCriteria = {
    offset?: number;
    limit?: number;
    filters?: SubjectFilters;
    sort?: Sort;
};

export type Page<T> = { items: T[]; total: number };

export interface ISubjectRepository {
    // listados “simples”
    paginate(criteria: ListSubjectsCriteria): Promise<Page<SubjectRead>>;
    list(criteria: ListSubjectsCriteria): Promise<SubjectRead[]>;

    // detalle:
    get_detail_by_id(id: string): Promise<SubjectDetail | null>;
    paginateDetail(criteria: ListSubjectsCriteria): Promise<Page<SubjectDetail>>; // 👈 NUEVO

    get_by_id(id: string): Promise<SubjectRead | null>;
    existsBy(filters: SubjectFilters): Promise<boolean>;
    create(data: SubjectCreate): Promise<SubjectRead>;
    update(id: string, data: SubjectUpdate): Promise<SubjectRead | null>;
    deleteById(id: string): Promise<boolean>;

    existsSubjectTopic(subjectId: string, topicId: string): Promise<boolean>;
    createSubjectTopic(subjectId: string, topicId: string): Promise<void>;
    deleteSubjectTopic(subjectId: string, topicId: string): Promise<boolean>;
}
