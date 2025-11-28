import { RetrieveOneSchema } from "../../../../shared/domain/base_response";
import { BaseCommand } from "../../../../shared/domain/base_use_case";
import { ExamAssignmentService } from "../../domain/services/examAssigmentService";
import { AssignExamToCourseResponse, CreateExamAssignmentCommandSchema } from "../../schemas/examAssignmentSchema";

export class CreateExamAssignmentCommand extends BaseCommand<
    CreateExamAssignmentCommandSchema,
    RetrieveOneSchema<AssignExamToCourseResponse>
> {
    constructor(private readonly svc: ExamAssignmentService) {
        super();
    }

    protected async executeBusinessLogic(
        input: CreateExamAssignmentCommandSchema
    ): Promise<RetrieveOneSchema<AssignExamToCourseResponse>> {

        const item = await this.svc.createExamAssignment(
            input.examId,
            input.course,
            input.currentUserId,
            input.applicationDate,
            input.durationMinutes,
        );
        return new RetrieveOneSchema(item, 'Exam assigned to course', true);
    }
}
