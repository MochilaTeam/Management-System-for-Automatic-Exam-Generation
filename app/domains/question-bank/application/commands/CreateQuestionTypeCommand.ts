// src/domains/question-bank/application/commands/CreateQuestionTypeCommand.ts
import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { QuestionTypeService } from '../../domain/services/questionTypeService';
import {
    CreateQuestionTypeCommandSchema,
    QuestionTypeRead,
} from '../../schemas/questionTypeSchema';

export class CreateQuestionTypeCommand extends BaseCommand<
    CreateQuestionTypeCommandSchema,
    RetrieveOneSchema<QuestionTypeRead>
> {
    constructor(private readonly svc: QuestionTypeService) {
        super();
    }

    protected async executeBusinessLogic(
        input: CreateQuestionTypeCommandSchema,
    ): Promise<RetrieveOneSchema<QuestionTypeRead>> {
        const qt = await this.svc.create(input);
        return new RetrieveOneSchema(qt, 'QuestionType created', true);
    }
}
