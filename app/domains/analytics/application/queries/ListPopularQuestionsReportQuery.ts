import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { AnalyticsService } from '../../domain/services/analyticsService';
import {
    PopularQuestionsReportInput,
    PopularQuestionsReportRow,
} from '../../schemas/analyticsSchema';

export class ListPopularQuestionsReportQuery extends BaseQuery<
    PopularQuestionsReportInput,
    PaginatedSchema<PopularQuestionsReportRow>
> {
    constructor(private readonly svc: AnalyticsService) {
        super();
    }

    protected async executeBusinessLogic(
        input: PopularQuestionsReportInput,
    ): Promise<PaginatedSchema<PopularQuestionsReportRow>> {
        return this.svc.listPopularQuestions(input);
    }
}
