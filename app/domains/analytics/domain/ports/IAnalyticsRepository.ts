import { DifficultyLevelEnum } from '../../../question-bank/entities/enums/DifficultyLevels';
import {
    AutomaticExamReportInput,
    AutomaticExamReportRow,
    ExamComparisonReportInput,
    ExamPerformanceRow,
    PopularQuestionsReportInput,
    PopularQuestionsReportRow,
    RegradeComparisonRow,
    ReviewerActivityReportInput,
    ReviewerActivityRow,
    SubjectDifficultyReportInput,
    TopFailingQuestionRow,
    ValidatedExamsReportInput,
    ValidatedExamReportRow,
} from '../../schemas/analyticsSchema';

export type AutomaticExamFilter = AutomaticExamReportInput;
export type PopularQuestionsFilter = PopularQuestionsReportInput;
export type ValidatedExamsFilter = ValidatedExamsReportInput;
export type SubjectDifficultyFilter = SubjectDifficultyReportInput;
export type ExamComparisonFilter = ExamComparisonReportInput;
export type ReviewerActivityFilter = ReviewerActivityReportInput;

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

    fetchSubjectDifficultyRecords(filter: SubjectDifficultyFilter): Promise<SubjectDifficultyRecord[]>;

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
