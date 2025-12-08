import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { AnalyticsService } from '../../domain/services/analyticsService';
import { ExamPerformanceParams, ExamPerformanceReport } from '../../schemas/analyticsSchema';

export class GetExamPerformanceReportQuery extends BaseQuery<
    ExamPerformanceParams,
    ExamPerformanceReport
> {
    constructor(private readonly svc: AnalyticsService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ExamPerformanceParams,
    ): Promise<ExamPerformanceReport> {
        return this.svc.getExamPerformance(input.examId);
    }
}
