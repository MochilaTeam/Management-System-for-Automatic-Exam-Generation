import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { AnalyticsService } from '../../domain/services/analyticsService';
import { ReviewerActivityReportInput, ReviewerActivityRow } from '../../schemas/analyticsSchema';

export class ListReviewerActivityReportQuery extends BaseQuery<
    ReviewerActivityReportInput,
    PaginatedSchema<ReviewerActivityRow>
> {
    constructor(private readonly svc: AnalyticsService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ReviewerActivityReportInput,
    ): Promise<PaginatedSchema<ReviewerActivityRow>> {
        return this.svc.listReviewerActivity(input);
    }
}
