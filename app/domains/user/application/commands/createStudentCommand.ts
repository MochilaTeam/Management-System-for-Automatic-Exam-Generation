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

export class CreateStudentCommand extends BaseCommand<CreateStudent, StudentRead> {
    constructor(private readonly uow: IUnitOfWork<StudentModuleServices>) {
        super();
    }

    protected async executeBusinessLogic(input: CreateStudent): Promise<StudentRead> {
        return this.uow.withTransaction(async ({ users, students }) => {
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
    }
}
