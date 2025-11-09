import { PaginatedSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { TeacherService } from '../../domain/services/teacherService';
import { ListTeachers, TeacherRead } from '../../schemas/teacherSchema';

export class ListTeachersQuery extends BaseQuery<ListTeachers, PaginatedSchema<TeacherRead>> {
    constructor(private readonly service: TeacherService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ListTeachers,
    ): Promise<PaginatedSchema<TeacherRead>> {
        return this.service.paginate(input);
    }
}
