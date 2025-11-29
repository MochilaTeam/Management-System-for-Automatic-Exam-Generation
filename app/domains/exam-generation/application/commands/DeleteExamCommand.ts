import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { ExamService } from '../../domain/services/examService';
import { ExamIdParams } from '../../schemas/examSchema';

export class DeleteExamCommand extends BaseCommand<ExamIdParams, void> {
    constructor(private readonly svc: ExamService) {
        super();
    }

    protected async executeBusinessLogic(input: ExamIdParams): Promise<void> {
        await this.svc.deleteExam(input.examId);
    }
}
