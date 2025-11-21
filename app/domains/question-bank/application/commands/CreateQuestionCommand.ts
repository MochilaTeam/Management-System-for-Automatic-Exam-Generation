import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { QuestionService } from '../../domain/services/questionService';
import { CreateQuestionBody, QuestionDetail } from '../../schemas/questionSchema';

type CreateQuestionInput = {
    body: CreateQuestionBody;
    currentUserId: string;
};

export class CreateQuestionCommand extends BaseCommand<
    CreateQuestionInput,
    RetrieveOneSchema<QuestionDetail>
> {
    constructor(private readonly svc: QuestionService) {
        super();
    }

    protected async executeBusinessLogic(
        input: CreateQuestionInput,
    ): Promise<RetrieveOneSchema<QuestionDetail>> {
        const item = await this.svc.create(input);
        return new RetrieveOneSchema(item, 'Question created', true);
    }
}
