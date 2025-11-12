import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { SubjectService } from '../../domain/services/subjectService';
import { SubjectIdParams, SubjectDetail } from '../../schemas/subjectSchema';

export class GetSubjectByIdQuery extends BaseQuery<
    SubjectIdParams,
    RetrieveOneSchema<SubjectDetail>
> {
    constructor(private readonly serv: SubjectService) {
        super();
    }

    protected async executeBusinessLogic(
        input: SubjectIdParams,
    ): Promise<RetrieveOneSchema<SubjectDetail>> {
        const detail = await this.serv.get_detail_by_id(input.subjectId);
        if (!detail) throw new NotFoundError({ message: 'Subject not found' });
        return new RetrieveOneSchema(detail);
    }
}
