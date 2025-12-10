import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { AnalyticsService } from '../../domain/services/analyticsService';
import { ExamComparisonReportInput, ExamComparisonRow } from '../../schemas/analyticsSchema';

export class CompareExamsReportQuery extends BaseQuery<
    ExamComparisonReportInput,
    PaginatedSchema<ExamComparisonRow>
> {
    constructor(private readonly svc: AnalyticsService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ExamComparisonReportInput,
    ): Promise<PaginatedSchema<ExamComparisonRow>> {
        return this.svc.compareExamsAcrossSubjects(input);
    }
}
