export type AnalyticsReportKey =
    | 'automatic-exams'
    | 'popular-questions'
    | 'validated-exams'
    | 'exam-performance'
    | 'subject-difficulty'
    | 'exam-comparison'
    | 'reviewer-activity';

export interface AnalyticsReportExporter {
    export(report: AnalyticsReportKey, payload: unknown, context?: unknown): Promise<Buffer>;
}
