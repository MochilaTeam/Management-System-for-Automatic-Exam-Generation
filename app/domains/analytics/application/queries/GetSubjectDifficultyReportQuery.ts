import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { AnalyticsService } from '../../domain/services/analyticsService';
import {
    SubjectDifficultyReport,
    SubjectDifficultyReportOptions,
} from '../../schemas/analyticsSchema';

export class GetSubjectDifficultyReportQuery extends BaseQuery<
    SubjectDifficultyReportOptions,
    SubjectDifficultyReport
> {
    constructor(private readonly svc: AnalyticsService) {
        super();
    }

    protected async executeBusinessLogic(
        input: SubjectDifficultyReportOptions,
    ): Promise<SubjectDifficultyReport> {
        return this.svc.getSubjectDifficultyReport(input);
    }
}
