import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { ExamService } from '../../domain/services/examService';
import { ExamDetailRead } from '../../schemas/examSchema';

type Input = {
    examId: string;
    currentUserId: string;
};

export class RejectExamCommand extends BaseCommand<Input, RetrieveOneSchema<ExamDetailRead>> {
    constructor(private readonly svc: ExamService) {
        super();
    }

    protected async executeBusinessLogic(input: Input): Promise<RetrieveOneSchema<ExamDetailRead>> {
        const detail = await this.svc.rejectExam(input.examId, input.currentUserId);
        return new RetrieveOneSchema(detail, 'Examen rechazado', true);
    }
}
