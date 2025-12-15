import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { AnalyticsService } from '../../domain/services/analyticsService';
import { ReviewerActivityReportOptions, ReviewerActivityRow } from '../../schemas/analyticsSchema';

export class ListReviewerActivityReportQuery extends BaseQuery<
    ReviewerActivityReportOptions,
    PaginatedSchema<ReviewerActivityRow>
> {
    constructor(private readonly svc: AnalyticsService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ReviewerActivityReportOptions,
    ): Promise<PaginatedSchema<ReviewerActivityRow>> {
        return this.svc.listReviewerActivity(input);
    }
}
