import { BaseCommand } from "../../../../shared/domain/base_use_case";
import { Roles } from "../../../../shared/enums/rolesEnum";
import { IUnitOfWork } from "../../../../shared/UoW/IUnitOfWork";
import { TeacherService } from "../../domain/services/teacherService";
import { UserService } from "../../domain/services/userService";
import { CreateTeacherCommand as CreateTeacherDTO, TeacherRead } from "../../schemas/teacherSchema";
import { UserRead } from "../../schemas/userSchema";

export type TeacherModuleServices = {
  users: UserService;
  teachers: TeacherService;
};

export class CreateTeacherCommand extends BaseCommand<CreateTeacherDTO, TeacherRead> {
  constructor(private readonly uow: IUnitOfWork<TeacherModuleServices>) {
    super();
  }

  protected async executeBusinessLogic(input: CreateTeacherDTO): Promise<TeacherRead> {
    return this.uow.withTransaction(async ({ users, teachers }) => {
      const newUser: UserRead = await users.create({
        name: input.name,
        email: input.email,
        role: input.role,
        password: input.password,
      });

      const hasRoleSubjectLeader = input.hasRoleSubjectLeader ?? (input.role === Roles.SUBJECT_LEADER);
      const hasRoleExaminer = input.hasRoleExaminer ?? (input.role === Roles.EXAMINER);

      return teachers.createProfile({
        userId: newUser.id,
        specialty: input.specialty,
        hasRoleSubjectLeader,
        hasRoleExaminer,
      });
    });
  }
}
