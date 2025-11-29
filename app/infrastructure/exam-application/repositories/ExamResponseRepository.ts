import {
    IExamResponseRepository,
    CreateExamResponseInput,
} from '../../../domains/exam-application/domain/ports/IExamResponseRepository';
import { ExamResponseOutput } from '../../../domains/exam-application/schemas/examResponseSchema';
import { ExamResponseMapper } from '../mappers/examResponseMapper';
import ExamResponses from '../models/ExamResponse';

export class ExamResponseRepository implements IExamResponseRepository {
    async create(data: CreateExamResponseInput): Promise<ExamResponseOutput> {
        const attrs = ExamResponseMapper.toCreateAttrs(data);
        const response = await ExamResponses.create(attrs);
        return ExamResponseMapper.toOutput(response);
    }
}
