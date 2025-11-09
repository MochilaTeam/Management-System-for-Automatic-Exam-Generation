import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { StudentService } from '../../domain/services/studentService';
import { StudentIdParams, StudentRead } from '../../schemas/studentSchema';

export class GetStudentByIdQuery extends BaseQuery<
    StudentIdParams,
    RetrieveOneSchema<StudentRead>
> {
    constructor(private readonly service: StudentService) {
        super();
    }

    protected async executeBusinessLogic(
        input: StudentIdParams,
    ): Promise<RetrieveOneSchema<StudentRead>> {
        const student = await this.service.getById(input.studentId);
        if (!student) {
            throw new NotFoundError({ message: 'STUDENT_NOT_FOUND' });
        }
        return new RetrieveOneSchema(student);
    }
}
