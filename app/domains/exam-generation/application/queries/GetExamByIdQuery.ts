import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { ExamService } from '../../domain/services/examService';
import { ExamDetailRead, ExamIdParams } from '../../schemas/examSchema';

export class GetExamByIdQuery extends BaseQuery<ExamIdParams, RetrieveOneSchema<ExamDetailRead>> {
    constructor(private readonly svc: ExamService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ExamIdParams,
    ): Promise<RetrieveOneSchema<ExamDetailRead>> {
        const exam = await this.svc.getById(input.examId);
        if (!exam) {
            throw new NotFoundError({ message: 'Exam not found' });
        }
        return new RetrieveOneSchema(exam, 'Examen encontrado', true);
    }
}



