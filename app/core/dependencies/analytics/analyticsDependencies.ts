import { CompareExamsReportQuery } from '../../../domains/analytics/application/queries/CompareExamsReportQuery';
import { GetExamPerformanceReportQuery } from '../../../domains/analytics/application/queries/GetExamPerformanceReportQuery';
import { GetSubjectDifficultyReportQuery } from '../../../domains/analytics/application/queries/GetSubjectDifficultyReportQuery';
import { ListAutomaticExamsReportQuery } from '../../../domains/analytics/application/queries/ListAutomaticExamsReportQuery';
import { ListPopularQuestionsReportQuery } from '../../../domains/analytics/application/queries/ListPopularQuestionsReportQuery';
import { ListReviewerActivityReportQuery } from '../../../domains/analytics/application/queries/ListReviewerActivityReportQuery';
import { ListValidatedExamsReportQuery } from '../../../domains/analytics/application/queries/ListValidatedExamsReportQuery';
import { AnalyticsService } from '../../../domains/analytics/domain/services/analyticsService';
import { AnalyticsRepository } from '../../../infrastructure/analytics/repositories/AnalyticsRepository';

let repo: AnalyticsRepository | null = null;
let svc: AnalyticsService | null = null;
let listAutomaticQuery: ListAutomaticExamsReportQuery | null = null;
let listPopularQuery: ListPopularQuestionsReportQuery | null = null;
let listValidatedQuery: ListValidatedExamsReportQuery | null = null;
let examPerformanceQuery: GetExamPerformanceReportQuery | null = null;
let subjectDifficultyQuery: GetSubjectDifficultyReportQuery | null = null;
let compareExamsQuery: CompareExamsReportQuery | null = null;
let reviewerActivityQuery: ListReviewerActivityReportQuery | null = null;

function getRepo() {
    if (repo) return repo;
    repo = new AnalyticsRepository();
    return repo;
}

function getService() {
    if (svc) return svc;
    svc = new AnalyticsService({ analyticsRepo: getRepo() });
    return svc;
}

export function makeListAutomaticExamsReportQuery() {
    if (listAutomaticQuery) return listAutomaticQuery;
    listAutomaticQuery = new ListAutomaticExamsReportQuery(getService());
    return listAutomaticQuery;
}

export function makeListPopularQuestionsReportQuery() {
    if (listPopularQuery) return listPopularQuery;
    listPopularQuery = new ListPopularQuestionsReportQuery(getService());
    return listPopularQuery;
}

export function makeListValidatedExamsReportQuery() {
    if (listValidatedQuery) return listValidatedQuery;
    listValidatedQuery = new ListValidatedExamsReportQuery(getService());
    return listValidatedQuery;
}

export function makeGetExamPerformanceReportQuery() {
    if (examPerformanceQuery) return examPerformanceQuery;
    examPerformanceQuery = new GetExamPerformanceReportQuery(getService());
    return examPerformanceQuery;
}

export function makeGetSubjectDifficultyReportQuery() {
    if (subjectDifficultyQuery) return subjectDifficultyQuery;
    subjectDifficultyQuery = new GetSubjectDifficultyReportQuery(getService());
    return subjectDifficultyQuery;
}

export function makeCompareExamsReportQuery() {
    if (compareExamsQuery) return compareExamsQuery;
    compareExamsQuery = new CompareExamsReportQuery(getService());
    return compareExamsQuery;
}

export function makeListReviewerActivityReportQuery() {
    if (reviewerActivityQuery) return reviewerActivityQuery;
    reviewerActivityQuery = new ListReviewerActivityReportQuery(getService());
    return reviewerActivityQuery;
}
