import { BaseDomainService } from '../../../../shared/domain/base_service';
import { ExamStatusEnum } from '../../../exam-generation/entities/enums/ExamStatusEnum';
import { DifficultyLevelEnum } from '../../../question-bank/entities/enums/DifficultyLevels';
import { IExamRepository, ListExamsCriteria } from '../ports/IExamRepository';
import { IExamQuestionRepository } from '../ports/IExamQuestionRepository';
import {
    IQuestionRepository,
    QuestionForExam,
    QuestionSearchCriteria,
} from '../ports/IQuestionRepository';
import {
    AutomaticExamPreview,
    CreateAutomaticExamCommandSchema,
    CreateManualExamCommandSchema,
    ExamDetailRead,
    ExamQuestionInput,
    ExamRead,
    ExamUpdate,
    ListExamsQuerySchema,
    UpdateExamCommandSchema,
} from '../../schemas/examSchema';

type Deps = {
    examRepo: IExamRepository;
    examQuestionRepo: IExamQuestionRepository;
    questionRepo: IQuestionRepository;
};

type DistributionSlot = {
    questionTypeId: string;
    count: number;
};

export class ExamService extends BaseDomainService {
    constructor(private readonly deps: Deps) {
        super();
    }

    async paginate(params: ListExamsQuerySchema): Promise<{ list: ExamRead[]; total: number }> {
        const repoCriteria: ListExamsCriteria = {
            limit: params.limit,
            offset: params.offset,
            filters: {
                subjectId: params.subjectId,
                difficulty: params.difficulty,
                examStatus: params.examStatus,
                authorId: params.authorId,
                title: params.title,
            },
        };
        const { items, total } = await this.deps.examRepo.paginate(repoCriteria);
        return { list: items, total };
    }

    async getById(id: string): Promise<ExamDetailRead | null> {
        const exam = await this.deps.examRepo.get_by_id(id);
        if (!exam) return null;
        const questions = await this.deps.examQuestionRepo.listByExamId(id);
        return { ...exam, questions };
    }

    private ensureQuestionsPayload(
        questions: ExamQuestionInput[],
        expectedCount: number,
        operation: string,
    ): ExamQuestionInput[] {
        if (questions.length !== expectedCount) {
            this.raiseValidationError(operation, 'La cantidad de preguntas no coincide con el total.', {
                entity: 'Exam',
            });
        }

        const idSet = new Set<string>();
        const indexSet = new Set<number>();
        for (const q of questions) {
            if (idSet.has(q.questionId)) {
                this.raiseValidationError(operation, 'Hay preguntas duplicadas en la solicitud.', {
                    entity: 'ExamQuestion',
                });
            }
            if (indexSet.has(q.questionIndex)) {
                this.raiseValidationError(operation, 'Los índices de las preguntas deben ser únicos.', {
                    entity: 'ExamQuestion',
                });
            }
            idSet.add(q.questionId);
            indexSet.add(q.questionIndex);
        }

        return [...questions].sort((a, b) => a.questionIndex - b.questionIndex);
    }

    private computeTopicProportion(questions: QuestionForExam[]): Record<string, number> {
        if (!questions.length) return {};
        const counts = new Map<string, number>();
        for (const question of questions) {
            const key = question.topicId ?? question.subTopicId ?? 'unknown';
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const total = questions.length;
        const result: Record<string, number> = {};
        for (const [key, value] of counts.entries()) {
            result[key] = Number((value / total).toFixed(4));
        }
        return result;
    }

    private buildCoverageFromManual(
        input: CreateManualExamCommandSchema,
        questionIds: string[],
    ): Record<string, unknown> {
        return (
            input.topicCoverage ?? {
                mode: 'manual',
                subjectId: input.subjectId,
                difficulty: input.difficulty,
                questionIds,
            }
        );
    }

    private buildCoverageFromAutomatic(
        input: CreateAutomaticExamCommandSchema,
    ): Record<string, unknown> {
        return (
            input.topicCoverage ?? {
                mode: 'automatic',
                subjectId: input.subjectId,
                difficulty: input.difficulty,
                distribution: input.questionTypeDistribution,
                filters: input.filters ?? {},
            }
        );
    }

    private buildDistribution(
        questionCount: number,
        distribution: CreateAutomaticExamCommandSchema['questionTypeDistribution'],
    ): DistributionSlot[] {
        const base = distribution.map((entry) => {
            const raw = (entry.percentage * questionCount) / 100;
            const floor = Math.floor(raw);
            return {
                questionTypeId: entry.questionTypeId,
                count: floor,
                remainder: raw - floor,
            };
        });

        let assigned = base.reduce((acc, item) => acc + item.count, 0);
        let remaining = questionCount - assigned;

        const sortedByRemainder = [...base].sort((a, b) => b.remainder - a.remainder);
        let idx = 0;
        while (remaining > 0 && sortedByRemainder.length > 0) {
            sortedByRemainder[idx % sortedByRemainder.length].count += 1;
            remaining -= 1;
            idx += 1;
        }

        return base.map((item) => ({
            questionTypeId: item.questionTypeId,
            count: item.count,
        }));
    }

    private async fetchQuestionsOrFail(ids: string[], operation: string): Promise<QuestionForExam[]> {
        const existing = await this.deps.questionRepo.findByIds(ids);
        if (existing.length !== ids.length) {
            this.raiseNotFoundError(operation, 'Alguna de las preguntas no existe.', {
                entity: 'Question',
            });
        }
        return existing;
    }

    private shuffleQuestions<T>(items: T[]): T[] {
        const arr = [...items];
        for (let i = arr.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    private async getExamDetailOrFail(examId: string, operation: string): Promise<ExamDetailRead> {
        const exam = await this.deps.examRepo.get_by_id(examId);
        if (!exam) {
            this.raiseNotFoundError(operation, 'El examen solicitado no existe.', { entity: 'Exam' });
        }
        const questions = await this.deps.examQuestionRepo.listByExamId(examId);
        return { ...exam, questions };
    }

    async createManualExam(input: CreateManualExamCommandSchema): Promise<ExamDetailRead> {
        const questions = this.ensureQuestionsPayload(
            input.questions,
            input.questionCount,
            'createManualExam',
        );
        const catalog = await this.fetchQuestionsOrFail(
            questions.map((q) => q.questionId),
            'createManualExam',
        );

        const topicProportion = input.topicProportion ?? this.computeTopicProportion(catalog);
        const topicCoverage = this.buildCoverageFromManual(
            input,
            questions.map((q) => q.questionId),
        );

        const created = await this.deps.examRepo.create({
            title: input.title,
            subjectId: input.subjectId,
            difficulty: input.difficulty,
            examStatus: input.examStatus ?? ExamStatusEnum.DRAFT,
            authorId: input.authorId,
            validatorId: input.validatorId,
            observations: input.observations ?? null,
            questionCount: input.questionCount,
            topicProportion,
            topicCoverage,
        });

        await this.deps.examQuestionRepo.replaceExamQuestions(created.id, questions);

        return this.getExamDetailOrFail(created.id, 'createManualExam');
    }

    async createAutomaticExam(
        input: CreateAutomaticExamCommandSchema,
    ): Promise<AutomaticExamPreview> {
        const distribution = this.buildDistribution(input.questionCount, input.questionTypeDistribution);
        const selected: QuestionForExam[] = [];
        const used = new Set<string>(input.filters?.excludeQuestionIds ?? []);

        for (const slot of distribution) {
            if (slot.count <= 0) continue;
            const criteria: QuestionSearchCriteria = {
                subjectId: input.subjectId,
                difficulty: input.difficulty,
                questionTypeIds: [slot.questionTypeId],
                topicIds: input.filters?.topicIds,
                subtopicIds: input.filters?.subtopicIds,
                excludeQuestionIds: Array.from(used),
                limit: slot.count,
            };
            const pool = await this.deps.questionRepo.findRandomByFilters(criteria);
            if (pool.length < slot.count) {
                this.raiseBusinessRuleError(
                    'createAutomaticExam',
                    'No hay suficientes preguntas para la parametrización solicitada.',
                );
            }
            pool.forEach((q) => used.add(q.id));
            selected.push(...pool);
        }

        if (selected.length !== input.questionCount) {
            this.raiseBusinessRuleError(
                'createAutomaticExam',
                'No se alcanzó la cantidad solicitada de preguntas.',
            );
        }

        const shuffled = this.shuffleQuestions(selected);
        const normalized: ExamQuestionInput[] = shuffled.map((question, idx) => ({
            questionId: question.id,
            questionIndex: idx + 1,
        }));

        const topicProportion = input.topicProportion ?? this.computeTopicProportion(selected);
        const topicCoverage = this.buildCoverageFromAutomatic(input);

        return {
            title: input.title,
            subjectId: input.subjectId,
            difficulty: input.difficulty,
            examStatus: input.examStatus ?? ExamStatusEnum.DRAFT,
            authorId: input.authorId,
            validatorId: input.validatorId ?? null,
            observations: input.observations ?? null,
            questionCount: input.questionCount,
            topicProportion,
            topicCoverage,
            questions: normalized,
        };
    }

    async updateExam(id: string, patch: UpdateExamCommandSchema): Promise<ExamDetailRead> {
        const existing = await this.deps.examRepo.get_by_id(id);
        if (!existing) {
            this.raiseNotFoundError('updateExam', 'El examen no existe.', { entity: 'Exam' });
        }

        const dto: ExamUpdate = {};
        if (patch.title !== undefined) dto.title = patch.title;
        if (patch.observations !== undefined) dto.observations = patch.observations;
        if (patch.examStatus !== undefined) dto.examStatus = patch.examStatus;
        if (patch.validatorId !== undefined) dto.validatorId = patch.validatorId;
        if (patch.topicProportion !== undefined) dto.topicProportion = patch.topicProportion;
        if (patch.topicCoverage !== undefined) dto.topicCoverage = patch.topicCoverage;

        let normalizedQuestions: ExamQuestionInput[] | null = null;
        if (patch.questions) {
            const targetCount = patch.questionCount ?? patch.questions.length;
            normalizedQuestions = this.ensureQuestionsPayload(
                patch.questions,
                targetCount,
                'updateExam',
            );
            const catalog = await this.fetchQuestionsOrFail(
                normalizedQuestions.map((q) => q.questionId),
                'updateExam',
            );
            if (dto.topicProportion === undefined) {
                dto.topicProportion = this.computeTopicProportion(catalog);
            }
            if (dto.topicCoverage === undefined) {
                dto.topicCoverage = {
                    mode: 'manual-update',
                    subjectId: existing.subjectId,
                    sourceQuestions: normalizedQuestions.map((q) => q.questionId),
                };
            }
            dto.questionCount = targetCount;
        } else if (patch.questionCount !== undefined) {
            this.raiseValidationError(
                'updateExam',
                'Debe adjuntar las preguntas para actualizar la cantidad total.',
                { entity: 'Exam' },
            );
        }

        const updated = await this.deps.examRepo.update(id, dto);
        if (!updated) {
            this.raiseNotFoundError('updateExam', 'El examen no existe.', { entity: 'Exam' });
        }

        if (normalizedQuestions) {
            await this.deps.examQuestionRepo.replaceExamQuestions(id, normalizedQuestions);
        }

        return this.getExamDetailOrFail(id, 'updateExam');
    }

    async deleteExam(id: string): Promise<boolean> {
        const deleted = await this.deps.examRepo.deleteById(id);
        if (!deleted) {
            this.raiseNotFoundError('deleteExam', 'El examen no existe.', { entity: 'Exam' });
        }
        return deleted;
    }
}
