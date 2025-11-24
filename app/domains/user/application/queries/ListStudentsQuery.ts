import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { StudentService } from '../../domain/services/studentService';
import { ListStudents, StudentRead } from '../../schemas/studentSchema';

export class ListStudentsQuery extends BaseQuery<ListStudents, PaginatedSchema<StudentRead>> {
    constructor(private readonly service: StudentService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ListStudents,
    ): Promise<PaginatedSchema<StudentRead>> {
        const limit = input.limit ?? 20;
        const offset = input.offset ?? 0;
        const { list, total } = await this.service.paginate(input);
        return new PaginatedSchema(list, { limit, offset, total });
    }
}
