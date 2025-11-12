import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { SubjectService } from '../../domain/services/subjectService';
import { SubjectIdParams } from '../../schemas/subjectSchema';

export class DeleteSubjectCommand extends BaseCommand<SubjectIdParams, void> {
    constructor(private readonly svc: SubjectService) {
        super();
    }
    protected async executeBusinessLogic(input: SubjectIdParams) {
        const deleted = await this.svc.deleteById(input.subjectId);
        if (!deleted) throw new NotFoundError({ message: 'SUBJECT_NOT_FOUND' });
    }
}
