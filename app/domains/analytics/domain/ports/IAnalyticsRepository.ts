import { DifficultyLevelEnum } from '../../../question-bank/entities/enums/DifficultyLevels';
import {
    AutomaticExamReportOptions,
    AutomaticExamReportRow,
    ExamComparisonReportOptions,
    ExamPerformanceRow,
    PopularQuestionsReportOptions,
    PopularQuestionsReportRow,
    RegradeComparisonRow,
    ReviewerActivityReportOptions,
    ReviewerActivityRow,
    SubjectDifficultyReportOptions,
    TopFailingQuestionRow,
    ValidatedExamsReportOptions,
    ValidatedExamReportRow,
} from '../../schemas/analyticsSchema';

export type AutomaticExamFilter = AutomaticExamReportOptions;
export type PopularQuestionsFilter = PopularQuestionsReportOptions;
export type ValidatedExamsFilter = ValidatedExamsReportOptions;
export type SubjectDifficultyFilter = SubjectDifficultyReportOptions;
export type ExamComparisonFilter = ExamComparisonReportOptions;
export type ReviewerActivityFilter = ReviewerActivityReportOptions;

export type SubjectDifficultyRecord = {
    subjectId: string;
    subjectName: string | null;
    difficulty: DifficultyLevelEnum;
    averageGrade: number | null;
    examCount: number;
};

export type ExamDifficultyRecord = {
    examId: string;
    difficulty: DifficultyLevelEnum;
    count: number;
};

export type ExamTopicRecord = {
    examId: string;
    topicId: string | null;
    topicName: string | null;
    count: number;
};

export interface IAnalyticsRepository {
    fetchAutomaticExams(filter: AutomaticExamFilter): Promise<{
        items: AutomaticExamReportRow[];
        total: number;
    }>;

    fetchPopularQuestions(filter: PopularQuestionsFilter): Promise<{
        items: PopularQuestionsReportRow[];
        total: number;
    }>;

    fetchValidatedExams(filter: ValidatedExamsFilter): Promise<{
        items: ValidatedExamReportRow[];
        total: number;
    }>;

    fetchExamPerformance(examId: string): Promise<ExamPerformanceRow[]>;

    fetchSubjectDifficultyRecords(
        filter: SubjectDifficultyFilter,
    ): Promise<SubjectDifficultyRecord[]>;

    fetchTopFailingQuestions(limit: number): Promise<TopFailingQuestionRow[]>;

    fetchRegradeComparison(): Promise<RegradeComparisonRow[]>;

    fetchExamComparisonBase(filter: ExamComparisonFilter): Promise<{
        exams: Array<{
            examId: string;
            title: string;
            subjectId: string;
            subjectName: string | null;
        }>;
        total: number;
    }>;

    fetchExamDifficultyRecords(examIds: string[]): Promise<ExamDifficultyRecord[]>;

    fetchExamTopicRecords(examIds: string[]): Promise<ExamTopicRecord[]>;

    fetchReviewerActivity(filter: ReviewerActivityFilter): Promise<{
        items: ReviewerActivityRow[];
        total: number;
    }>;
}
