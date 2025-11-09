import { StudentModuleServices } from './createStudentCommand';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { IUnitOfWork } from '../../../../shared/UoW/IUnitOfWork';
import { StudentIdParams } from '../../schemas/studentSchema';

export class DeleteStudentCommand extends BaseCommand<StudentIdParams, void> {
    constructor(private readonly uow: IUnitOfWork<StudentModuleServices>) {
        super();
    }

    protected async executeBusinessLogic(input: StudentIdParams): Promise<void> {
        return this.uow.withTransaction(async ({ users, students }) => {
            const student = await students.getById(input.studentId);
            if (!student) {
                throw new NotFoundError({ message: 'STUDENT_NOT_FOUND' });
            }

            const deactivated = await users.deleteById(student.userId);
            if (!deactivated) {
                throw new NotFoundError({ message: 'USER_NOT_FOUND' });
            }
        });
    }
}
