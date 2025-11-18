import { BaseDomainService } from '../../../../shared/domain/base_service';
import { type StudentRead, type ListStudents } from '../../schemas/studentSchema';
import { IStudentRepository } from '../ports/IStudentRepository';
import { ListStudentsCriteria } from '../ports/IStudentRepository';
import { IUserRepository } from '../ports/IUserRepository';

type Deps = {
    studentRepo: IStudentRepository;
    userRepo: IUserRepository;
};

export class StudentService extends BaseDomainService {
    constructor(private readonly deps: Deps) {
        super();
    }

    async createProfile(input: {
        userId: string;
        age: number;
        course: number;
    }): Promise<StudentRead> {
        const user = await this.deps.userRepo.get_by_id(input.userId);
        if (!user) {
            this.raiseNotFoundError('createProfile', 'User not found', {
                entity: 'User',
                code: 'USER_NOT_FOUND',
            });
        }

        const duplicated = await this.deps.studentRepo.existsBy({ userId: input.userId });
        if (duplicated) {
            this.raiseBusinessRuleError('createProfile', 'Student profile already exists for user', {
                entity: 'Student',
                code: 'STUDENT_ALREADY_EXISTS_FOR_USER',
            });
        }
        const created = await this.deps.studentRepo.createProfile({
            userId: input.userId,
            age: input.age,
            course: input.course,
        });

        return created;
    }

    async getById(id: string): Promise<StudentRead | null> {
        return this.deps.studentRepo.get_by_id(id);
    }

    async paginate(criteria: ListStudents): Promise<{ list: StudentRead[]; total: number }> {
        const limit = criteria.limit ?? 20;
        const offset = criteria.offset ?? 0;
        const active = criteria.active ?? true;
        const repoCriteria: ListStudentsCriteria = {
            limit,
            offset,
            filters: {
                userId: criteria.userId,
                role: criteria.role,
                active,
                filter: criteria.filter,
                email: criteria.email,
            },
        };
        const { items, total } = await this.deps.studentRepo.paginate(repoCriteria);
        return { list: items, total };
    }

    //update al perfil de student
    async updateProfile(
        id: string,
        patch: Partial<{ age: number; course: number }>,
    ): Promise<StudentRead | null> {
        const updated = await this.deps.studentRepo.updateProfile(id, patch);
        return updated;
    }

    async deleteById(id: string): Promise<boolean> {
        return this.deps.studentRepo.deleteById(id);
    }
}
