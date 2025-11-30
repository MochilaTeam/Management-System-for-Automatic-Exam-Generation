import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { ExamService } from '../../domain/services/examService';
import { AcceptExamCommandSchema, ExamDetailRead } from '../../schemas/examSchema';

type Input = AcceptExamCommandSchema;

export class AcceptExamCommand extends BaseCommand<Input, RetrieveOneSchema<ExamDetailRead>> {
    constructor(private readonly svc: ExamService) {
        super();
    }

    protected async executeBusinessLogic(input: Input): Promise<RetrieveOneSchema<ExamDetailRead>> {
        const detail = await this.svc.acceptExam(input.examId, input.currentUserId, input.comment);
        return new RetrieveOneSchema(detail, 'Examen aceptado', true);
    }
}
