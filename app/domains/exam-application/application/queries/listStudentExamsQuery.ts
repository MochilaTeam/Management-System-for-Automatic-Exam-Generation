import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { ExamAssignmentService } from '../../domain/services/examAssigmentService';
import {
    ListStudentExamsQuery as ListStudentExamsInput,
    StudentExamAssignmentItem,
} from '../../schemas/examAssignmentSchema';

export class ListStudentExamsQuery extends BaseQuery<
    ListStudentExamsInput,
    PaginatedSchema<StudentExamAssignmentItem>
> {
    constructor(private readonly service: ExamAssignmentService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ListStudentExamsInput,
    ): Promise<PaginatedSchema<StudentExamAssignmentItem>> {
        const limit = input.limit ?? 10;
        const page = input.page ?? 1;
        const offset = (page - 1) * limit;

        const { items, total } = await this.service.listStudentExams({
            currentUserId: input.currentUserId,
            page: input.page,
            limit: input.limit,
            status: input.status,
            subjectId: input.subjectId,
            teacherId: input.teacherId,
        });

        return new PaginatedSchema(items, { limit, offset, total });
    }
}
