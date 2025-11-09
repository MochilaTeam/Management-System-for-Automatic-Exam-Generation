import { StudentModuleServices } from './createStudentCommand';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { Roles } from '../../../../shared/enums/rolesEnum';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { IUnitOfWork } from '../../../../shared/UoW/IUnitOfWork';
import { StudentRead, UpdateStudentPayload } from '../../schemas/studentSchema';

type UpdateStudentCommandInput = {
    id: string;
    patch: UpdateStudentPayload;
};

export class UpdateStudentCommand extends BaseCommand<UpdateStudentCommandInput, StudentRead> {
    constructor(private readonly uow: IUnitOfWork<StudentModuleServices>) {
        super();
    }

    protected async executeBusinessLogic(input: UpdateStudentCommandInput): Promise<StudentRead> {
        return this.uow.withTransaction(async ({ users, students }) => {
            const existing = await students.getById(input.id);
            if (!existing) {
                throw new NotFoundError({ message: 'STUDENT_NOT_FOUND' });
            }

            const studentPatch: { age?: number; course?: number } = {};
            if (input.patch.age !== undefined) studentPatch.age = input.patch.age;
            if (input.patch.course !== undefined) studentPatch.course = input.patch.course;

            const userPatch: {
                name?: string;
                email?: string;
                password?: string;
                role?: Roles;
            } = {};

            if (input.patch.name !== undefined) userPatch.name = input.patch.name;
            if (input.patch.email !== undefined) userPatch.email = input.patch.email;
            if (input.patch.password !== undefined) userPatch.password = input.patch.password;
            if (input.patch.role !== undefined) userPatch.role = input.patch.role;

            if (Object.keys(userPatch).length > 0) {
                await users.update(existing.userId, userPatch);
            }

            if (Object.keys(studentPatch).length > 0) {
                await students.updateProfile(input.id, studentPatch);
            }

            const updated = await students.getById(input.id);
            return updated!;
        });
    }
}
