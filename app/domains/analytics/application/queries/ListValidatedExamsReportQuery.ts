import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { AnalyticsService } from '../../domain/services/analyticsService';
import { ValidatedExamReportRow, ValidatedExamsReportOptions } from '../../schemas/analyticsSchema';

export class ListValidatedExamsReportQuery extends BaseQuery<
    ValidatedExamsReportOptions,
    PaginatedSchema<ValidatedExamReportRow>
> {
    constructor(private readonly svc: AnalyticsService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ValidatedExamsReportOptions,
    ): Promise<PaginatedSchema<ValidatedExamReportRow>> {
        return this.svc.listValidatedExams(input);
    }
}
