import { BaseQuery } from '../../../../shared/domain/base_use_case';
import { TeacherService } from '../../domain/services/teacherService';
import { TeacherRead } from '../../schemas/teacherSchema';

type ListTeachersBySubjectInput = {
    subjectId: string;
};

export class ListTeachersBySubjectQuery extends BaseQuery<
    ListTeachersBySubjectInput,
    TeacherRead[]
> {
    constructor(private readonly service: TeacherService) {
        super();
    }

    protected async executeBusinessLogic(
        input: ListTeachersBySubjectInput,
    ): Promise<TeacherRead[]> {
        return this.service.findTeachersBySubject(input.subjectId);
    }
}
