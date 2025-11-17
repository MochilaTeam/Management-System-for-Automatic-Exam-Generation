// src/domains/question-bank/application/commands/UpdateQuestionTypeCommand.ts
import { RetrieveOneSchema } from '../../../../shared/domain/base_response';
import { BaseCommand } from '../../../../shared/domain/base_use_case';
import { NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { QuestionTypeService } from '../../domain/services/questionTypeService';
import {
    QuestionTypeRead,
    UpdateQuestionTypeCommandSchema,
} from '../../schemas/questionTypeSchema';

type UpdateQuestionTypeInput = {
    questionTypeId: string;
    patch: UpdateQuestionTypeCommandSchema;
};

export class UpdateQuestionTypeCommand extends BaseCommand<
    UpdateQuestionTypeInput,
    RetrieveOneSchema<QuestionTypeRead>
> {
    constructor(private readonly svc: QuestionTypeService) {
        super();
    }

    protected async executeBusinessLogic(
        input: UpdateQuestionTypeInput,
    ): Promise<RetrieveOneSchema<QuestionTypeRead>> {
        const updated = await this.svc.update(input.questionTypeId, input.patch);
        if (!updated) {
            throw new NotFoundError({ message: 'Tipo de pregunta no encontrado' });
        }
        return new RetrieveOneSchema(updated, 'QuestionType updated', true);
    }
}
