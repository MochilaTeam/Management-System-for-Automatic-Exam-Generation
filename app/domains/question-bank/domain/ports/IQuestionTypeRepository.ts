import { QuestionTypeEnum } from '../../entities/enums/QuestionType';
import {
    QuestionTypeCreate,
    QuestionTypeRead,
    QuestionTypeUpdate,
} from '../../schemas/questionTypeSchema';

export type QuestionTypeFilters = {
    name?: QuestionTypeEnum;
};

export type ListQuestionTypesCriteria = {
    offset?: number;
    limit?: number;
    filters?: QuestionTypeFilters;
};

// Resultado de paginación genérico
export type Page<T> = { items: T[]; total: number };

export interface IQuestionTypeRepository {
    paginate(criteria: ListQuestionTypesCriteria): Promise<Page<QuestionTypeRead>>;
    list(criteria: ListQuestionTypesCriteria): Promise<QuestionTypeRead[]>;

    get_by_id(id: string): Promise<QuestionTypeRead | null>;
    existsByName(name: QuestionTypeEnum): Promise<boolean>;

    create(data: QuestionTypeCreate): Promise<QuestionTypeRead>;
    update(id: string, data: QuestionTypeUpdate): Promise<QuestionTypeRead | null>;
    deleteById(id: string): Promise<boolean>;
}
