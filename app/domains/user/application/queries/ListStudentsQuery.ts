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
        return this.service.paginate(input);
    }
}
