import { TeacherModuleServices } from './createTeacherCommand';
import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { Roles } from '../../../../shared/enums/rolesEnum';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { IUnitOfWork } from '../../../../shared/UoW/IUnitOfWork';
import { TeacherRead, UpdateTeacherCommand as UpdateTeacherDTO } from '../../schemas/teacherSchema';

type UpdateTeacherInput = {
    id: string;
    patch: UpdateTeacherDTO;
};

export class UpdateTeacherCommand extends BaseCommand<
    UpdateTeacherInput,
    RetrieveOneSchema<TeacherRead>
> {
    constructor(private readonly uow: IUnitOfWork<TeacherModuleServices>) {
        super();
    }

    protected async executeBusinessLogic(
        input: UpdateTeacherInput,
    ): Promise<RetrieveOneSchema<TeacherRead>> {
        const updatedTeacher = await this.uow.withTransaction(async ({ users, teachers }) => {
            const existing = await teachers.getById(input.id);
            if (!existing) {
                throw new NotFoundError({ message: 'TEACHER_NOT_FOUND' });
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
                subjects_ids?: string[];
                teaching_subjects_ids?: string[];
            } = {};

            if (input.patch.specialty !== undefined) teacherPatch.specialty = input.patch.specialty;
            const nextSubjectLeader =
                input.patch.hasRoleSubjectLeader ??
                (input.patch.role !== undefined
                    ? input.patch.role === Roles.SUBJECT_LEADER
                    : undefined);
            if (nextSubjectLeader !== undefined) {
                teacherPatch.hasRoleSubjectLeader = nextSubjectLeader;
            }

            const nextExaminer =
                input.patch.hasRoleExaminer ??
                (input.patch.role !== undefined ? input.patch.role === Roles.EXAMINER : undefined);
            if (nextExaminer !== undefined) {
                teacherPatch.hasRoleExaminer = nextExaminer;
            }

            if (input.patch.subjects_ids !== undefined) {
                teacherPatch.subjects_ids = input.patch.subjects_ids;
            }
            if (input.patch.teaching_subjects_ids !== undefined) {
                teacherPatch.teaching_subjects_ids = input.patch.teaching_subjects_ids;
            }

            const updated = await teachers.updateProfile(input.id, teacherPatch);
            return updated!;
        });
        return new RetrieveOneSchema(updatedTeacher, 'Teacher updated', true);
    }
}
