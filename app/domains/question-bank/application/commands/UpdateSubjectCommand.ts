import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { SubjectService } from '../../domain/services/subjectService';
import { UpdateSubjectBody, SubjectDetail } from '../../schemas/subjectSchema';

type UpdateInput = { subjectId: string; patch: UpdateSubjectBody };

export class UpdateSubjectCommand extends BaseCommand<
    UpdateInput,
    RetrieveOneSchema<SubjectDetail>
> {
    constructor(private readonly svc: SubjectService) {
        super();
    }
    protected async executeBusinessLogic(input: UpdateInput) {
        const updated = await this.svc.update(input.subjectId, input.patch);
        if (!updated) throw new NotFoundError({ message: 'SUBJECT_NOT_FOUND' });
        return new RetrieveOneSchema(updated, 'Subject updated', true);
    }
}
