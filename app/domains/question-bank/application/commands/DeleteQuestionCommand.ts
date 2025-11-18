import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { QuestionService } from '../../domain/services/questionService';

type DeleteQuestionInput = {
    questionId: string;
    currentUserId: string;
};

export class DeleteQuestionCommand extends BaseCommand<DeleteQuestionInput, void> {
    constructor(private readonly svc: QuestionService) {
        super();
    }

    protected async executeBusinessLogic(input: DeleteQuestionInput): Promise<void> {
        await this.svc.deleteById(input);
    }
}

