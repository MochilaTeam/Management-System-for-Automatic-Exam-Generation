import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { ExamAssignmentService } from '../../domain/services/examAssigmentService';
import {
    SendExamToEvaluatorCommandSchema,
    StudentExamAssignmentItem,
} from '../../schemas/examAssignmentSchema';

export class SendExamToEvaluatorCommand extends BaseCommand<
    SendExamToEvaluatorCommandSchema,
    RetrieveOneSchema<StudentExamAssignmentItem>
> {
    constructor(private readonly service: ExamAssignmentService) {
        super();
    }

    protected async executeBusinessLogic(
        input: SendExamToEvaluatorCommandSchema,
    ): Promise<RetrieveOneSchema<StudentExamAssignmentItem>> {
        const result = await this.service.sendExamToEvaluator(input);
        return new RetrieveOneSchema(result, 'Exam sent to evaluation', true);
    }
}
