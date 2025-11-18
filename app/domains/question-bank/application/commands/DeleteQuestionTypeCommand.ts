// src/domains/question-bank/application/commands/DeleteQuestionTypeCommand.ts
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { QuestionTypeService } from '../../domain/services/questionTypeService';

type DeleteQuestionTypeInput = {
    questionTypeId: string;
};

export class DeleteQuestionTypeCommand extends BaseCommand<DeleteQuestionTypeInput, void> {
    constructor(private readonly svc: QuestionTypeService) {
        super();
    }

    protected async executeBusinessLogic(input: DeleteQuestionTypeInput): Promise<void> {
        const deleted = await this.svc.deleteById(input.questionTypeId);
        if (!deleted) {
            throw new NotFoundError({ message: 'Tipo de pregunta no encontrado' });
        }
    }
}
