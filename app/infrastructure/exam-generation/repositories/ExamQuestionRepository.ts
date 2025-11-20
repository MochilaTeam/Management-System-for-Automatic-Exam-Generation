import { ModelStatic, Transaction } from 'sequelize';

import { IExamQuestionRepository } from '../../../domains/exam-application/domain/ports/IExamQuestionRepository';
import {
    ExamQuestionInput,
    ExamQuestionRead,
} from '../../../domains/exam-application/schemas/examSchema';
import { BaseRepository } from '../../../shared/domain/base_repository';
import { ExamQuestionMapper } from '../mappers/ExamQuestionMapper';
import type ExamQuestion from '../models/ExamQuestion';

export class ExamQuestionRepository
    extends BaseRepository<
        ExamQuestion,
        ExamQuestionRead,
        ExamQuestionInput & { examId: string },
        ExamQuestionInput
    >
    implements IExamQuestionRepository
{
    constructor(model: ModelStatic<ExamQuestion>, defaultTx?: Transaction) {
        super(
            model,
            ExamQuestionMapper.toRead,
            (dto) => ({
                examId: dto.examId,
                questionId: dto.questionId,
                questionIndex: dto.questionIndex,
            }),
            (dto) => ({
                questionId: dto.questionId,
                questionIndex: dto.questionIndex,
            }),
            defaultTx,
        );
    }

    static withTx(model: ModelStatic<ExamQuestion>, tx: Transaction) {
        return new ExamQuestionRepository(model, tx);
    }

    async replaceExamQuestions(examId: string, questions: ExamQuestionInput[], tx?: Transaction) {
        try {
            const effTx = this.effTx(tx);
            await this.model.destroy({ where: { examId }, transaction: effTx });
            if (!questions.length) return;
            const rows = ExamQuestionMapper.toBulkCreateAttrs(examId, questions);
            await this.model.bulkCreate(rows as ExamQuestion['_creationAttributes'][], {
                transaction: effTx,
            });
        } catch (error) {
            this.raiseError(error, this.model.name);
        }
    }

    async listByExamId(examId: string, tx?: Transaction): Promise<ExamQuestionRead[]> {
        return this.listByOptions(
            {
                where: { examId },
                order: [['questionIndex', 'ASC']],
            },
            tx,
        );
    }
}
