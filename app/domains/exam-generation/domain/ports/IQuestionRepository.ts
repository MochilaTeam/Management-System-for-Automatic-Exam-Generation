import { DifficultyLevelEnum } from '../../../question-bank/entities/enums/DifficultyLevels';

export type QuestionOption = { text: string; isCorrect: boolean };

export type QuestionForExam = {
    id: string;
    difficulty: DifficultyLevelEnum;
    questionTypeId: string;
    subTopicId: string | null;
    topicId: string | null;
    body: string;
    options: QuestionOption[] | null;
    response: string | null;
};

export type QuestionSearchCriteria = {
    ids?: string[];
    subjectId?: string;
    topicIds?: string[];
    subtopicIds?: string[];
    difficulty?: DifficultyLevelEnum;
    questionTypeIds?: string[];
    excludeQuestionIds?: string[];
    limit?: number;
};

export interface IQuestionRepository {
    findByIds(ids: string[]): Promise<QuestionForExam[]>;
    findRandomByFilters(criteria: QuestionSearchCriteria): Promise<QuestionForExam[]>;
    getGroupedCounts(
        criteria: Omit<QuestionSearchCriteria, 'limit' | 'excludeQuestionIds' | 'ids'>,
    ): Promise<Array<{ questionTypeId: string; difficulty: DifficultyLevelEnum; count: number }>>;
}
