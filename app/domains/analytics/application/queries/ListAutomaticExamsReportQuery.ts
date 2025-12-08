import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { AnalyticsService } from '../../domain/services/analyticsService';
import { AutomaticExamReportInput, AutomaticExamReportRow } from '../../schemas/analyticsSchema';

export class ListAutomaticExamsReportQuery extends BaseQuery<
    AutomaticExamReportInput,
    PaginatedSchema<AutomaticExamReportRow>
> {
    constructor(private readonly svc: AnalyticsService) {
        super();
    }

    protected async executeBusinessLogic(
        input: AutomaticExamReportInput,
    ): Promise<PaginatedSchema<AutomaticExamReportRow>> {
        return this.svc.listAutomaticExams(input);
    }
}
