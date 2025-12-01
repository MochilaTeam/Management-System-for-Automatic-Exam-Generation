import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { ExamAssignmentService } from '../../domain/services/examAssigmentService';
import {
    CalculateExamGradeCommandSchema,
    CalculateExamGradeResult,
} from '../../schemas/examAssignmentSchema';

export class CalculateExamGradeCommand extends BaseCommand<
    CalculateExamGradeCommandSchema,
    RetrieveOneSchema<CalculateExamGradeResult>
> {
    constructor(private readonly service: ExamAssignmentService) {
        super();
    }

    protected async executeBusinessLogic(
        input: CalculateExamGradeCommandSchema,
    ): Promise<RetrieveOneSchema<CalculateExamGradeResult>> {
        const data = await this.service.calculateExamGrade(input);
        return new RetrieveOneSchema(data, 'Calificación del examen actualizada', true);
    }
}
