import { BaseDomainService } from '../../../../shared/domain/base_service';
import { ListTeachers, TeacherRead } from '../../schemas/teacherSchema';
import { ITeacherRepository, ListTeachersCriteria } from '../ports/ITeacherRepository';
import {
    ITeacherSubjectLinkRepository,
    TeacherSubjectAssignments,
} from '../ports/ITeacherSubjectLinkRepository';
import { IUserRepository } from '../ports/IUserRepository';

type Deps = {
    teacherRepo: ITeacherRepository;
    userRepo: IUserRepository;
    subjectLinkRepo: ITeacherSubjectLinkRepository;
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
        subjects_ids?: string[];
        teaching_subjects_ids?: string[];
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

        const leadSubjectIds = input.subjects_ids ?? [];
        const teachingSubjectIds = input.teaching_subjects_ids ?? [];
        await this.ensureSubjectsExist([...leadSubjectIds, ...teachingSubjectIds], 'createProfile');
        await this.ensureSubjectsHaveNoLeader(leadSubjectIds, null, 'createProfile');

        const teacher = await this.deps.teacherRepo.createProfile({
            userId: input.userId,
            specialty: input.specialty,
            hasRoleSubjectLeader: input.hasRoleSubjectLeader,
            hasRoleExaminer: input.hasRoleExaminer,
        });
        await this.deps.subjectLinkRepo.syncTeachingSubjects(teacher.id, teachingSubjectIds);
        await this.deps.subjectLinkRepo.syncLeadSubjects(teacher.id, leadSubjectIds);
        const assignments = await this.deps.subjectLinkRepo.getAssignments(teacher.id);
        return this.mergeWithAssignments(teacher, assignments);
    }

    async getById(id: string): Promise<TeacherRead | null> {
        const teacher = await this.deps.teacherRepo.get_by_id(id);
        if (!teacher) return null;
        const assignments = await this.deps.subjectLinkRepo.getAssignments(id);
        return this.mergeWithAssignments(teacher, assignments);
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
        const assignmentMap = await this.deps.subjectLinkRepo.getAssignmentsForTeachers(
            items.map((item) => item.id),
        );
        const list = items.map((teacher) =>
            this.mergeWithAssignments(teacher, assignmentMap.get(teacher.id)),
        );
        return { list, total };
    }

    async findTeachersBySubject(subjectId: string): Promise<TeacherRead[]> {
        if (!subjectId) return [];

        const teacherIds = await this.deps.subjectLinkRepo.findTeachersForSubject(subjectId);
        if (teacherIds.length === 0) return [];

        const teachers = await this.deps.teacherRepo.findByIds(teacherIds);
        if (teachers.length === 0) return [];

        const assignmentMap = await this.deps.subjectLinkRepo.getAssignmentsForTeachers(
            teachers.map((teacher) => teacher.id),
        );

        const merged = teachers.map((teacher) =>
            this.mergeWithAssignments(teacher, assignmentMap.get(teacher.id)),
        );
        return merged.sort((a, b) => a.name.localeCompare(b.name));
    }

    async updateProfile(
        id: string,
        patch: Partial<{
            specialty: string;
            hasRoleSubjectLeader: boolean;
            hasRoleExaminer: boolean;
            subjects_ids: string[];
            teaching_subjects_ids: string[];
        }>,
    ): Promise<TeacherRead | null> {
        const teacherFields: Partial<{
            specialty: string;
            hasRoleSubjectLeader: boolean;
            hasRoleExaminer: boolean;
        }> = {};
        if (patch.specialty !== undefined) teacherFields.specialty = patch.specialty;
        if (patch.hasRoleSubjectLeader !== undefined)
            teacherFields.hasRoleSubjectLeader = patch.hasRoleSubjectLeader;
        if (patch.hasRoleExaminer !== undefined)
            teacherFields.hasRoleExaminer = patch.hasRoleExaminer;

        let updated = Object.keys(teacherFields).length
            ? await this.deps.teacherRepo.updateProfile(id, teacherFields)
            : await this.deps.teacherRepo.get_by_id(id);
        if (!updated) return null;

        if (patch.teaching_subjects_ids !== undefined) {
            await this.ensureSubjectsExist(patch.teaching_subjects_ids, 'updateProfile');
            await this.deps.subjectLinkRepo.syncTeachingSubjects(id, patch.teaching_subjects_ids);
        }

        if (patch.subjects_ids !== undefined) {
            await this.ensureSubjectsExist(patch.subjects_ids, 'updateProfile');
            await this.ensureSubjectsHaveNoLeader(patch.subjects_ids, id, 'updateProfile');
            await this.deps.subjectLinkRepo.syncLeadSubjects(id, patch.subjects_ids);
        }

        const assignments = await this.deps.subjectLinkRepo.getAssignments(id);
        return this.mergeWithAssignments(updated, assignments);
    }

    async deleteById(id: string): Promise<boolean> {
        await this.deps.subjectLinkRepo.syncTeachingSubjects(id, []);
        await this.deps.subjectLinkRepo.syncLeadSubjects(id, []);
        return this.deps.teacherRepo.deleteById(id);
    }

    private async ensureSubjectsExist(subjectIds: string[], operation: string) {
        const uniqueIds = Array.from(new Set(subjectIds));
        if (uniqueIds.length === 0) return;
        const missing = await this.deps.subjectLinkRepo.findMissingSubjectIds(uniqueIds);
        if (missing.length > 0) {
            this.raiseNotFoundError(operation, 'Subject not found', {
                entity: 'Subject',
                code: 'SUBJECT_NOT_FOUND',
                details: { ids: missing },
            });
        }
    }

    private mergeWithAssignments(
        teacher: TeacherRead,
        assignments?: TeacherSubjectAssignments,
    ): TeacherRead {
        const lists = assignments ?? {
            leadSubjectIds: [],
            leadSubjectNames: [],
            teachingSubjectIds: [],
            teachingSubjectNames: [],
        };
        return {
            ...teacher,
            subjects_ids: lists.leadSubjectIds,
            subjects_names: lists.leadSubjectNames,
            teaching_subjects_ids: lists.teachingSubjectIds,
            teaching_subjects_names: lists.teachingSubjectNames,
        };
    }

    private async ensureSubjectsHaveNoLeader(
        subjectIds: string[],
        teacherId: string | null,
        operation: string,
    ) {
        const uniqueIds = Array.from(new Set(subjectIds));
        if (uniqueIds.length === 0) return;

        const leaders = await this.deps.subjectLinkRepo.findSubjectLeaders(uniqueIds);
        const conflicts = uniqueIds.filter((id) => {
            const leaderId = leaders.get(id);
            return leaderId && leaderId !== teacherId;
        });

        if (conflicts.length > 0) {
            this.raiseBusinessRuleError(operation, 'La asignatura ya tiene un jefe', {
                entity: 'Subject',
                code: 'La asignatura ya tiene un jefe',
                details: { subjectIds: conflicts },
            });
        }
    }
}
