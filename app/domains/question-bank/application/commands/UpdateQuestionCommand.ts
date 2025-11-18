import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { QuestionService } from '../../domain/services/questionService';
import { QuestionDetail, UpdateQuestionBody } from '../../schemas/questionSchema';

type UpdateQuestionInput = {
    questionId: string;
    patch: UpdateQuestionBody;
    currentUserId: string;
};

export class UpdateQuestionCommand extends BaseCommand<
    UpdateQuestionInput,
    RetrieveOneSchema<QuestionDetail>
> {
    constructor(private readonly svc: QuestionService) {
        super();
    }

    protected async executeBusinessLogic(
        input: UpdateQuestionInput,
    ): Promise<RetrieveOneSchema<QuestionDetail>> {
        const item = await this.svc.update(input);
        return new RetrieveOneSchema(item, 'Question updated', true);
    }
}

