import { ConflictError } from '../../../../shared/exceptions/domainErrors';
import { QuestionTypeEnum } from '../../entities/enums/QuestionType';
import {
    CreateQuestionTypeCommandSchema,
    ListQuestionTypes,
    QuestionTypeCreate,
    QuestionTypeRead,
    QuestionTypeUpdate,
} from '../../schemas/questionTypeSchema';
import {
    IQuestionTypeRepository,
    ListQuestionTypesCriteria,
} from '../ports/IQuestionTypeRepository';
import {BaseDomainService} from "../../../../shared/domain/base_service"

type Deps = {
    repo: IQuestionTypeRepository;
};

export class QuestionTypeService extends BaseDomainService{
    public readonly repo: IQuestionTypeRepository;

    constructor(deps: Deps) {
        super(); 
        this.repo = deps.repo;
    }

    async create(input: CreateQuestionTypeCommandSchema): Promise<QuestionTypeRead> {
        const name = input.name;

        const taken = await this.repo.existsByName(name);
        if (taken) {
            throw new ConflictError({ message: 'El tipo de pregunta ya existe' });
        }

        const dto: QuestionTypeCreate = { name };
        const res: QuestionTypeRead = await this.repo.create(dto);
        return res;
    }

    async paginate(
        criteria: ListQuestionTypes,
    ): Promise<{ list: QuestionTypeRead[]; total: number }> {
        const limit = criteria.limit ?? 20;
        const offset = criteria.offset ?? 0;

        const repoCriteria: ListQuestionTypesCriteria = {
            limit,
            offset,
            filters: {},
        };

        const { items, total } = await this.repo.paginate(repoCriteria);
        return { list: items, total };
    }

    async update(
        id: string,
        patch: Partial<{ name: QuestionTypeEnum }>,
    ): Promise<QuestionTypeRead | null> {
        const current = await this.repo.get_by_id(id);
        if (!current) return null;

        const dto: Partial<QuestionTypeUpdate> = {};

        if (patch.name != null) {
            if (patch.name !== current.name) {
                const taken = await this.repo.existsByName(patch.name);
                if (taken) {
                    throw new ConflictError({ message: 'El tipo de pregunta ya existe' });
                }
            }
            dto.name = patch.name;
        }

        return this.repo.update(id, dto as QuestionTypeUpdate);
    }

    async get_by_id(id: string): Promise<QuestionTypeRead | null> {
        return this.repo.get_by_id(id);
    }

    async deleteById(id: string): Promise<boolean> {
        return this.repo.deleteById(id);
    }
}
