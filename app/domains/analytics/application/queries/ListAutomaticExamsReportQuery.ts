import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { AnalyticsService } from '../../domain/services/analyticsService';
import { AutomaticExamReportOptions, AutomaticExamReportRow } from '../../schemas/analyticsSchema';

export class ListAutomaticExamsReportQuery extends BaseQuery<
    AutomaticExamReportOptions,
    PaginatedSchema<AutomaticExamReportRow>
> {
    constructor(private readonly svc: AnalyticsService) {
        super();
    }

    protected async executeBusinessLogic(
        input: AutomaticExamReportOptions,
    ): Promise<PaginatedSchema<AutomaticExamReportRow>> {
        return this.svc.listAutomaticExams(input);
    }
}
