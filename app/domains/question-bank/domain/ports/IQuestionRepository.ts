import { DifficultyLevelEnum } from '../../entities/enums/DifficultyLevels';
import { QuestionCreate, QuestionDetail, QuestionUpdate } from '../../schemas/questionSchema';

export type QuestionFilters = {
    q?: string;
    subtopicId?: string;
    subtopicIds?: string[];
    authorId?: string;
    difficulty?: DifficultyLevelEnum;
    questionTypeId?: string;
};

export type ListQuestionsCriteria = {
    offset?: number;
    limit?: number;
    filters?: QuestionFilters;
};

export type Page<T> = { items: T[]; total: number };

export interface IQuestionRepository {
    paginateDetail(criteria: ListQuestionsCriteria): Promise<Page<QuestionDetail>>;
    get_detail_by_id(id: string, includeInactive?: boolean): Promise<QuestionDetail | null>;

    create(data: QuestionCreate): Promise<QuestionDetail>;
    update(id: string, patch: QuestionUpdate): Promise<QuestionDetail | null>;

    deleteHardById(id: string): Promise<boolean>;
    softDeleteById(id: string): Promise<boolean>;

    existsByStatementAndSubtopic(statement: string, subtopicId: string): Promise<boolean>;
    existsByStatementAndSubtopicExceptId(
        statement: string,
        subtopicId: string,
        excludeId: string,
    ): Promise<boolean>;
}
