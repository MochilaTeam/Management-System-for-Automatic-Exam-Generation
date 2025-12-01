import {
    IExamResponseRepository,
    CreateExamResponseInput,
    UpdateExamResponseInput,
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

    async findById(responseId: string): Promise<ExamResponseOutput | null> {
        const response = await ExamResponses.findByPk(responseId);
        return response ? ExamResponseMapper.toOutput(response) : null;
    }

    async findByExamQuestionAndStudent(
        examQuestionId: string,
        studentId: string,
    ): Promise<ExamResponseOutput | null> {
        const response = await ExamResponses.findOne({ where: { examQuestionId, studentId } });
        return response ? ExamResponseMapper.toOutput(response) : null;
    }

    async update(data: UpdateExamResponseInput): Promise<ExamResponseOutput> {
        const response = await ExamResponses.findByPk(data.responseId);
        if (!response) {
            throw new Error('Exam response not found');
        }

        await response.update({
            selectedOptions: data.selectedOptions,
            textAnswer: data.textAnswer,
            autoPoints: data.autoPoints,
            answeredAt: data.answeredAt,
        });

        return ExamResponseMapper.toOutput(response);
    }

    async studentHasResponses(examId: string, studentId: string): Promise<boolean> {
        const count = await ExamResponses.count({ where: { examId, studentId } });
        return count > 0;
    }

    async listByExamAndStudent(examId: string, studentId: string): Promise<ExamResponseOutput[]> {
        const rows = await ExamResponses.findAll({ where: { examId, studentId } });
        return rows.map((row) => ExamResponseMapper.toOutput(row));
    }
}
