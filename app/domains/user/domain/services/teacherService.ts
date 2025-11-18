import { BaseDomainService } from '../../../../shared/domain/base_service';
import { ListTeachers, TeacherRead } from '../../schemas/teacherSchema';
import { ITeacherRepository, ListTeachersCriteria } from '../ports/ITeacherRepository';
import { IUserRepository } from '../ports/IUserRepository';

type Deps = {
    teacherRepo: ITeacherRepository;
    userRepo: IUserRepository;
};

export class TeacherService extends BaseDomainService {
    constructor(private readonly deps: Deps) {
        super();
    }

    async createProfile(input: {
        userId: string;
        specialty: string;
        hasRoleSubjectLeader: boolean;
        hasRoleExaminer: boolean;
    }): Promise<TeacherRead> {
        const user = await this.deps.userRepo.get_by_id(input.userId);
        if (!user) {
            this.raiseNotFoundError('createProfile', 'User not found', {
                entity: 'User',
                code: 'USER_NOT_FOUND',
            });
        }

        const duplicated = await this.deps.teacherRepo.existsBy({ userId: input.userId });
        if (duplicated) {
            this.raiseBusinessRuleError(
                'createProfile',
                'Teacher profile already exists for user',
                {
                    entity: 'Teacher',
                    code: 'TEACHER_ALREADY_EXISTS_FOR_USER',
                },
            );
        }

        return this.deps.teacherRepo.createProfile({
            userId: input.userId,
            specialty: input.specialty,
            hasRoleSubjectLeader: input.hasRoleSubjectLeader,
            hasRoleExaminer: input.hasRoleExaminer,
        });
    }

    async getById(id: string): Promise<TeacherRead | null> {
        return this.deps.teacherRepo.get_by_id(id);
    }

    async paginate(criteria: ListTeachers): Promise<{ list: TeacherRead[]; total: number }> {
        const limit = criteria.limit ?? 20;
        const offset = criteria.offset ?? 0;
        const active = criteria.active ?? true;

        const repoCriteria: ListTeachersCriteria = {
            limit,
            offset,
            filters: {
                userId: criteria.userId,
                role: criteria.role,
                active,
                filter: criteria.filter,
                email: criteria.email,
                subjectLeader: criteria.subjectLeader,
                examiner: criteria.examiner,
            },
        };

        const { items, total } = await this.deps.teacherRepo.paginate(repoCriteria);
        return { list: items, total };
    }

    async updateProfile(
        id: string,
        patch: Partial<{
            specialty: string;
            hasRoleSubjectLeader: boolean;
            hasRoleExaminer: boolean;
        }>,
    ): Promise<TeacherRead | null> {
        return this.deps.teacherRepo.updateProfile(id, patch);
    }

    async deleteById(id: string): Promise<boolean> {
        return this.deps.teacherRepo.deleteById(id);
    }
}
