import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { SubjectService } from '../../domain/services/subjectService';
import { CreateSubjectBody, SubjectRead } from '../../schemas/subjectSchema';

type Input = { body: CreateSubjectBody };

export class CreateSubjectCommand extends BaseCommand<Input, RetrieveOneSchema<SubjectRead>> {
    constructor(private readonly svc: SubjectService) {
        super();
    }
    protected async executeBusinessLogic(input: Input) {
        const item = await this.svc.create(input.body);
        return new RetrieveOneSchema(item, 'Subject created', true);
    }
}
