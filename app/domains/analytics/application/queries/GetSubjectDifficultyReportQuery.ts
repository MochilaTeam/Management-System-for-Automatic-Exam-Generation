import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { AnalyticsService } from '../../domain/services/analyticsService';
import {
    SubjectDifficultyReport,
    SubjectDifficultyReportInput,
} from '../../schemas/analyticsSchema';

export class GetSubjectDifficultyReportQuery extends BaseQuery<
    SubjectDifficultyReportInput,
    SubjectDifficultyReport
> {
    constructor(private readonly svc: AnalyticsService) {
        super();
    }

    protected async executeBusinessLogic(
        input: SubjectDifficultyReportInput,
    ): Promise<SubjectDifficultyReport> {
        return this.svc.getSubjectDifficultyReport(input);
    }
}
