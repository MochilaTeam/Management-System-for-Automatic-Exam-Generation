import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { AnalyticsService } from '../../domain/services/analyticsService';
import { ExamComparisonReportOptions, ExamComparisonRow } from '../../schemas/analyticsSchema';

export class CompareExamsReportQuery extends BaseQuery<
    ExamComparisonReportOptions,
    PaginatedSchema<ExamComparisonRow>
> {
    constructor(private readonly svc: AnalyticsService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ExamComparisonReportOptions,
    ): Promise<PaginatedSchema<ExamComparisonRow>> {
        return this.svc.compareExamsAcrossSubjects(input);
    }
}
