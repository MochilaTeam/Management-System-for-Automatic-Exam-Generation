import {
    CreateSubjectBody,
    SubjectCreate,
    SubjectRead,
    SubjectUpdate,
    ListSubjects,
    SubjectDetail,
} from '../../schemas/subjectSchema';
import { ISubjectRepository, ListSubjectsCriteria } from '../ports/ISubjectRepository';

type Deps = { repo: ISubjectRepository };

export class SubjectService {
    public readonly repo: ISubjectRepository;
    constructor(deps: Deps) {
        this.repo = deps.repo;
    }

    private norm(s: string) {
        return s.trim();
    }

    async create(input: CreateSubjectBody): Promise<SubjectDetail> {
        const name = this.norm(input.subject_name);
        const program = this.norm(input.subject_program);
        const taken = await this.repo.existsBy({ name });
        if (taken) throw new Error('SUBJECT_NAME_TAKEN');
        const dto: SubjectCreate = { name, program, leadTeacherId: null };
        const subject = await this.repo.create(dto);
        const detail = await this.repo.get_detail_by_id(subject.id);
        if (!detail) throw new Error('SUBJECT_NOT_FOUND_AFTER_CREATE');
        return detail;
    }

    async paginate(criteria: ListSubjects): Promise<{ list: SubjectRead[]; total: number }> {
        const limit = criteria.limit ?? 20;
        const offset = criteria.offset ?? 0;
        const repoCriteria: ListSubjectsCriteria = { limit, offset, filters: { q: criteria.q } };
        const { items, total } = await this.repo.paginate(repoCriteria);
        return { list: items, total };
    }

    async paginateDetail(
        criteria: ListSubjects,
    ): Promise<{ list: SubjectDetail[]; total: number }> {
        const limit = criteria.limit ?? 20;
        const offset = criteria.offset ?? 0;

        const repoCriteria: ListSubjectsCriteria = {
            limit,
            offset,
            filters: {
                q: criteria.q,
                name: criteria.name,
                program: criteria.program,
                leadTeacherId: criteria.leader_id,
            },
            sort: criteria.sort_field
                ? { field: criteria.sort_field, dir: criteria.sort_dir ?? 'asc' }
                : undefined,
        };

        const { items, total } = await this.repo.paginateDetail(repoCriteria);
        return { list: items, total };
    }
    async update(
        id: string,
        patch: Partial<{ subject_name: string; subject_program: string }>,
    ): Promise<SubjectDetail | null> {
        const current = await this.repo.get_by_id(id);
        if (!current) return null;
        const dto: Partial<SubjectUpdate> = {};
        if (patch.subject_name != null) {
            const newName = this.norm(patch.subject_name);
            if (newName !== current.name) {
                const taken = await this.repo.existsBy({ name: newName });
                if (taken) throw new Error('SUBJECT_NAME_TAKEN');
            }
            dto.name = newName;
        }
        if (patch.subject_program != null) dto.program = this.norm(patch.subject_program);
        const updated = await this.repo.update(id, dto as SubjectUpdate);
        if (!updated) return null;
        const detail = await this.repo.get_detail_by_id(updated.id);
        if (!detail) throw new Error('SUBJECT_NOT_FOUND_AFTER_UPDATE');
        return detail;
    }

    async get_detail_by_id(id: string): Promise<SubjectDetail | null> {
        return this.repo.get_detail_by_id(id);
    }

    async get_by_id(id: string) {
        return this.repo.get_by_id(id);
    }
    async deleteById(id: string) {
        return this.repo.deleteById(id);
    }
}
