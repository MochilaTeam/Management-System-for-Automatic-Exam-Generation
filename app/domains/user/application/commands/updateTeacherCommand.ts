import { BaseCommand } from "../../../../shared/domain/base_use_case";
import { NotFoundError } from "../../../../shared/exceptions/domainErrors";
import { Roles } from "../../../../shared/enums/rolesEnum";
import { IUnitOfWork } from "../../../../shared/UoW/IUnitOfWork";
import { TeacherRead, UpdateTeacherCommand as UpdateTeacherDTO } from "../../schemas/teacherSchema";
import { TeacherModuleServices } from "./createTeacherCommand";

type UpdateTeacherInput = {
  id: string;
  patch: UpdateTeacherDTO;
};

export class UpdateTeacherCommand extends BaseCommand<UpdateTeacherInput, TeacherRead> {
  constructor(private readonly uow: IUnitOfWork<TeacherModuleServices>) {
    super();
  }

  protected async executeBusinessLogic(input: UpdateTeacherInput): Promise<TeacherRead> {
    return this.uow.withTransaction(async ({ users, teachers }) => {
      const existing = await teachers.getById(input.id);
      if (!existing) {
        throw new NotFoundError({ message: "TEACHER_NOT_FOUND" });
      }

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

      const teacherPatch: {
        specialty?: string;
        hasRoleSubjectLeader?: boolean;
        hasRoleExaminer?: boolean;
      } = {};

      if (input.patch.specialty !== undefined) teacherPatch.specialty = input.patch.specialty;
      const nextSubjectLeader =
        input.patch.hasRoleSubjectLeader ??
        (input.patch.role !== undefined ? input.patch.role === Roles.SUBJECT_LEADER : undefined);
      if (nextSubjectLeader !== undefined) {
        teacherPatch.hasRoleSubjectLeader = nextSubjectLeader;
      }

      const nextExaminer =
        input.patch.hasRoleExaminer ??
        (input.patch.role !== undefined ? input.patch.role === Roles.EXAMINER : undefined);
      if (nextExaminer !== undefined) {
        teacherPatch.hasRoleExaminer = nextExaminer;
      }

      if (Object.keys(teacherPatch).length > 0) {
        await teachers.updateProfile(input.id, teacherPatch);
      }

      const updated = await teachers.getById(input.id);
      return updated!;
    });
  }
}
