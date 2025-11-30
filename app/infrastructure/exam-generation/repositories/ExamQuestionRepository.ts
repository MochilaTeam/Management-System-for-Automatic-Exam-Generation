import { ModelStatic, Transaction } from 'sequelize';

import { IExamQuestionRepository } from '../../../domains/exam-generation/domain/ports/IExamQuestionRepository';
import {
    ExamQuestionInput,
    ExamQuestionRead,
} from '../../../domains/exam-generation/schemas/examSchema';
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

    async getById(id: string, tx?: Transaction): Promise<ExamQuestionRead | null> {
        const row = await this.model.findByPk(id, { transaction: this.effTx(tx) });
        return row ? ExamQuestionMapper.toRead(row) : null;
    }

    async findByExamIdAndIndex(
        examId: string,
        questionIndex: number,
        tx?: Transaction,
    ): Promise<ExamQuestionRead | null> {
        const row = await this.model.findOne({
            where: { examId, questionIndex },
            transaction: this.effTx(tx),
        });
        return row ? ExamQuestionMapper.toRead(row) : null;
    }
}
