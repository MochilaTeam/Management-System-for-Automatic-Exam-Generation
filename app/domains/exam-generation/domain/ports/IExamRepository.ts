import { ExamStatusEnum } from '../../../exam-application/entities/enums/ExamStatusEnum';
import { DifficultyLevelEnum } from '../../../question-bank/entities/enums/DifficultyLevels';
import { ExamCreate, ExamRead, ExamUpdate, ListExamsQuerySchema } from '../../schemas/examSchema';

export type ExamFilters = {
    subjectId?: string;
    subjectIds?: string[];
    difficulty?: DifficultyLevelEnum;
    examStatus?: ExamStatusEnum;
    authorId?: string;
    validatorId?: string;
    title?: string;
};

export type ExamSort = {
    field: 'createdAt' | 'title';
    dir?: 'asc' | 'desc';
};

export type ListExamsCriteria = Omit<ListExamsQuerySchema, 'limit' | 'offset'> & {
    offset?: number;
    limit?: number;
    filters?: ExamFilters;
    sort?: ExamSort;
};

export type Page<T> = { items: T[]; total: number };

export interface IExamRepository {
    paginate(criteria: ListExamsCriteria): Promise<Page<ExamRead>>;
    list(criteria: ListExamsCriteria): Promise<ExamRead[]>;

    get_by_id(id: string): Promise<ExamRead | null>;

    create(data: ExamCreate): Promise<ExamRead>;
    update(id: string, data: ExamUpdate): Promise<ExamRead | null>;
    deleteById(id: string): Promise<boolean>;
}
