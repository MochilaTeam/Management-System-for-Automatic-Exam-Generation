import { BaseCommand } from "../../../../shared/domain/base_use_case";
import { IUnitOfWork } from "../../../../shared/UoW/IUnitOfWork";
import { CreateStudent, StudentRead } from "../../schemas/studentSchema";
import { UserRead } from "../../schemas/userSchema";
import { Roles } from "../../../../shared/enums/rolesEnum";
import { UserService } from "../../../user/domain/services/userService";
import { StudentService } from "../../domain/services/studentService";

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
      //crear el user
      const newUser: UserRead = await users.create({
        name: input.name,
        email: input.email,
        password: input.password,
        role: Roles.STUDENT,
      });

      //crear estudiante y retornar con el join a user
      const created = await students.createProfile({
        userId: newUser.id,
        age: input.age,
        course: input.course,
      });

      return created;
    });
  }
}
