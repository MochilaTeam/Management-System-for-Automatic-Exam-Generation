import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { Roles } from '../../../../shared/enums/rolesEnum';
import { IUnitOfWork } from '../../../../shared/UoW/IUnitOfWork';
import { UserService } from '../../../user/domain/services/userService';
import { StudentService } from '../../domain/services/studentService';
import { CreateStudent, StudentRead } from '../../schemas/studentSchema';
import { UserRead } from '../../schemas/userSchema';

export type StudentModuleServices = {
    users: UserService;
    students: StudentService;
};

export class CreateStudentCommand extends BaseCommand<
    CreateStudent,
    RetrieveOneSchema<StudentRead>
> {
    constructor(private readonly uow: IUnitOfWork<StudentModuleServices>) {
        super();
    }

    protected async executeBusinessLogic(
        input: CreateStudent,
    ): Promise<RetrieveOneSchema<StudentRead>> {
        const result = await this.uow.withTransaction(async ({ users, students }) => {
            const newUser: UserRead = await users.create({
                name: input.name,
                email: input.email,
                role: Roles.STUDENT,
                password: input.password,
            });
            const created = await students.createProfile({
                userId: newUser.id,
                age: input.age,
                course: input.course,
            });

            return created;
        });
        return new RetrieveOneSchema(result, 'Student created', true);
    }
}
