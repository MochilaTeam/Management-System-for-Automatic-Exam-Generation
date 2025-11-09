import { TeacherModuleServices } from './createTeacherCommand';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { IUnitOfWork } from '../../../../shared/UoW/IUnitOfWork';
import { TeacherIdParams } from '../../schemas/teacherSchema';

export class DeleteTeacherCommand extends BaseCommand<TeacherIdParams, void> {
    constructor(private readonly uow: IUnitOfWork<TeacherModuleServices>) {
        super();
    }

    protected async executeBusinessLogic(input: TeacherIdParams): Promise<void> {
        return this.uow.withTransaction(async ({ users, teachers }) => {
            const teacher = await teachers.getById(input.teacherId);
            if (!teacher) {
                throw new NotFoundError({ message: 'TEACHER_NOT_FOUND' });
            }

            const deactivated = await users.deleteById(teacher.userId);
            if (!deactivated) {
                throw new NotFoundError({ message: 'USER_NOT_FOUND' });
            }
        });
    }
}
