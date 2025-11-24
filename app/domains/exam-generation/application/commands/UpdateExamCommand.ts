import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { ExamService } from '../../domain/services/examService';
import { ExamDetailRead, UpdateExamCommandSchema } from '../../schemas/examSchema';

type Input = {
    examId: string;
    patch: UpdateExamCommandSchema;
};

export class UpdateExamCommand extends BaseCommand<Input, RetrieveOneSchema<ExamDetailRead>> {
    constructor(private readonly svc: ExamService) {
        super();
    }

    protected async executeBusinessLogic(input: Input): Promise<RetrieveOneSchema<ExamDetailRead>> {
        const detail = await this.svc.updateExam(input.examId, input.patch);
        return new RetrieveOneSchema(detail, 'Examen actualizado', true);
    }
}
