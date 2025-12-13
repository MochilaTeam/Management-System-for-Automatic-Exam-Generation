import Subject from '../../../../infrastructure/question-bank/models/Subject';
import TeacherSubject from '../../../../infrastructure/question-bank/models/TeacherSubject';
import { Teacher } from '../../../../infrastructure/user/models';
import { BaseDomainService } from '../../../../shared/domain/base_service';
import { ExamStatusEnum } from '../../../exam-application/entities/enums/ExamStatusEnum';
import { DifficultyLevelEnum } from '../../../question-bank/entities/enums/DifficultyLevels';
import {
    AutomaticExamPreview,
    CreateAutomaticExamCommandSchema,
    CreateManualExamCommandSchema,
    DifficultyCountMap,
    ExamDetailRead,
    ExamQuestionInput,
    ExamRead,
    ExamUpdate,
    ListExamsQuerySchema,
    QuestionTypeDistributionEntry,
    UpdateExamCommandSchema,
} from '../../schemas/examSchema';
import { IExamQuestionRepository } from '../ports/IExamQuestionRepository';
import { IExamRepository, ListExamsCriteria } from '../ports/IExamRepository';
import {
    IQuestionRepository,
    QuestionForExam,
    QuestionSearchCriteria,
} from '../ports/IQuestionRepository';

type Deps = {
    examRepo: IExamRepository;
    examQuestionRepo: IExamQuestionRepository;
    questionRepo: IQuestionRepository;
};

type TeacherPlain = {
    id: string;
    userId: string;
    hasRoleSubjectLeader: boolean;
    hasRoleExaminer: boolean;
};

type SubjectPlain = { id: string; leadTeacherId: string | null };

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
                subjectIds: params.subjectIds,
                difficulty: params.difficulty,
                examStatus: params.examStatus,
                active: true,
                authorId: params.authorId,
                validatorId: params.validatorId,
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
            this.raiseValidationError(
                operation,
                'La cantidad de preguntas no coincide con el total.',
                {
                    entity: 'Exam',
                },
            );
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
                this.raiseValidationError(
                    operation,
                    'Los índices de las preguntas deben ser únicos.',
                    {
                        entity: 'ExamQuestion',
                    },
                );
            }
            if (q.questionScore <= 0) {
                this.raiseValidationError(operation, 'La nota de la pregunta debe ser mayor a 0.', {
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

    private deriveDifficultyFromCatalog(questions: QuestionForExam[]): DifficultyLevelEnum {
        if (!questions.length) return DifficultyLevelEnum.MEDIUM;
        const weights: Record<DifficultyLevelEnum, number> = {
            [DifficultyLevelEnum.EASY]: 1,
            [DifficultyLevelEnum.MEDIUM]: 2,
            [DifficultyLevelEnum.HARD]: 3,
        };
        const average =
            questions.reduce((acc, question) => acc + (weights[question.difficulty] ?? 2), 0) /
            questions.length;
        if (average < 1.5) return DifficultyLevelEnum.EASY;
        if (average < 2.5) return DifficultyLevelEnum.MEDIUM;
        return DifficultyLevelEnum.HARD;
    }

    private deriveDifficultyFromDistribution(counts: DifficultyCountMap): DifficultyLevelEnum {
        const weights: Record<DifficultyLevelEnum, number> = {
            [DifficultyLevelEnum.EASY]: 1,
            [DifficultyLevelEnum.MEDIUM]: 2,
            [DifficultyLevelEnum.HARD]: 3,
        };
        const total = (Object.keys(counts) as Array<keyof DifficultyCountMap>).reduce(
            (acc, key) => acc + counts[key],
            0,
        );
        if (!total) {
            return DifficultyLevelEnum.MEDIUM;
        }
        const weightedSum = (Object.keys(counts) as Array<keyof DifficultyCountMap>).reduce(
            (acc, key) => acc + weights[key as DifficultyLevelEnum] * counts[key],
            0,
        );
        const average = weightedSum / total;
        if (average < 1.5) return DifficultyLevelEnum.EASY;
        if (average < 2.5) return DifficultyLevelEnum.MEDIUM;
        return DifficultyLevelEnum.HARD;
    }

    private buildCoverageFromManual(
        subjectId: string,
        difficulty: DifficultyLevelEnum,
        questionIds: string[],
    ): Record<string, unknown> {
        return {
            mode: 'manual',
            subjectId,
            difficulty,
            questionIds,
        };
    }

    private buildCoverageFromAutomatic(
        input: CreateAutomaticExamCommandSchema,
        difficulty: DifficultyLevelEnum,
    ): Record<string, unknown> {
        return {
            mode: 'automatic',
            subjectId: input.subjectId,
            difficulty,
            typeCounts: input.questionTypeCounts,
            difficultyCounts: input.difficultyCounts,
            topicIds: input.topicIds ?? [],
            subtopicDistribution: input.subtopicDistribution ?? [],
        };
    }

    private buildSelectionPlan(
        operation: string,
        questionCount: number,
        typeEntries: QuestionTypeDistributionEntry[],
        difficultyCounts: DifficultyCountMap,
    ) {
        const typeMap = new Map<string, number>();
        typeEntries.forEach((entry) => {
            if (entry.count <= 0) return;
            typeMap.set(
                entry.questionTypeId,
                (typeMap.get(entry.questionTypeId) ?? 0) + entry.count,
            );
        });

        const difficultyMap = new Map<DifficultyLevelEnum, number>();
        (Object.keys(difficultyCounts) as Array<keyof DifficultyCountMap>).forEach((key) => {
            const value = difficultyCounts[key];
            if (value > 0) {
                difficultyMap.set(key as DifficultyLevelEnum, value);
            }
        });

        const entries: Array<{
            questionTypeId: string;
            difficulty: DifficultyLevelEnum;
            count: number;
        }> = [];

        for (const [typeId, typeCount] of typeMap.entries()) {
            let remainingType = typeCount;
            for (const diffKey of Array.from(difficultyMap.keys())) {
                if (remainingType <= 0) break;
                const diffRemaining = difficultyMap.get(diffKey) ?? 0;
                if (diffRemaining <= 0) continue;
                const allocation = Math.min(remainingType, diffRemaining);
                entries.push({ questionTypeId: typeId, difficulty: diffKey, count: allocation });
                remainingType -= allocation;
                difficultyMap.set(diffKey, diffRemaining - allocation);
            }

            if (remainingType > 0) {
                this.raiseValidationError(
                    operation,
                    'No se puede cumplir la combinación de tipos y dificultades solicitada.',
                    { entity: 'Exam' },
                );
            }
        }

        const remainingDifficulty = Array.from(difficultyMap.values()).reduce(
            (acc, value) => acc + value,
            0,
        );
        if (remainingDifficulty > 0) {
            this.raiseValidationError(
                operation,
                'No se puede cumplir la combinación de tipos y dificultades solicitada.',
                { entity: 'Exam' },
            );
        }

        const totalAllocated = entries.reduce((acc, entry) => acc + entry.count, 0);
        if (totalAllocated !== questionCount) {
            this.raiseValidationError(
                operation,
                'La parametrización de tipos y dificultades no coincide con la cantidad solicitada.',
                { entity: 'Exam' },
            );
        }

        return entries;
    }

    private async fetchQuestionsOrFail(
        ids: string[],
        operation: string,
    ): Promise<QuestionForExam[]> {
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

    private async getExamOrFail(examId: string, operation: string): Promise<ExamRead> {
        const exam = await this.deps.examRepo.get_by_id(examId);
        if (!exam) {
            this.raiseNotFoundError(operation, 'El examen solicitado no existe.', {
                entity: 'Exam',
            });
        }
        return exam;
    }

    private async getExamDetailOrFail(examId: string, operation: string): Promise<ExamDetailRead> {
        const exam = await this.getExamOrFail(examId, operation);
        const questions = await this.deps.examQuestionRepo.listByExamId(examId);
        return { ...exam, questions };
    }

    private async getTeacherByUserId(operation: string, userId: string): Promise<TeacherPlain> {
        const row = await Teacher.findOne({ where: { userId } });
        if (!row) {
            this.raiseBusinessRuleError(operation, 'El usuario no posee un perfil de docente.', {
                entity: 'Teacher',
                code: 'TEACHER_PROFILE_NOT_FOUND',
            });
        }
        return row.get({ plain: true }) as TeacherPlain;
    }

    private async ensureSubjectLeaderForExam(
        operation: string,
        subjectId: string,
        currentUserId: string,
    ): Promise<TeacherPlain> {
        const teacher = await this.getTeacherByUserId(operation, currentUserId);
        if (!teacher.hasRoleSubjectLeader) {
            this.raiseBusinessRuleError(
                operation,
                'Solo un jefe de asignatura puede realizar esto.',
                {
                    entity: 'Teacher',
                    code: 'SUBJECT_LEADER_ROLE_REQUIRED',
                },
            );
        }
        const subject = await Subject.findByPk(subjectId);
        if (!subject) {
            this.raiseNotFoundError(operation, 'La asignatura asociada al examen no existe.', {
                entity: 'Subject',
            });
        }
        const subjectPlain = subject.get({ plain: true }) as SubjectPlain;
        if (subjectPlain.leadTeacherId !== teacher.id) {
            this.raiseBusinessRuleError(
                operation,
                'El docente no es el jefe asignado de la asignatura del examen.',
                {
                    entity: 'Subject',
                    code: 'TEACHER_NOT_SUBJECT_LEADER',
                },
            );
        }
        return teacher;
    }

    private async ensureExaminerForExam(
        operation: string,
        subjectId: string,
        currentUserId: string,
    ): Promise<TeacherPlain> {
        const teacher = await this.getTeacherByUserId(operation, currentUserId);
        if (!teacher.hasRoleExaminer) {
            this.raiseBusinessRuleError(
                operation,
                'Solo un docente con rol de examinador puede solicitar la revisión.',
                {
                    entity: 'Teacher',
                    code: 'EXAMINER_ROLE_REQUIRED',
                },
            );
        }

        const subject = await Subject.findByPk(subjectId);
        if (!subject) {
            this.raiseNotFoundError(operation, 'La asignatura asociada al examen no existe.', {
                entity: 'Subject',
            });
        }
        const subjectPlain = subject.get({ plain: true }) as SubjectPlain;

        if (subjectPlain.leadTeacherId === teacher.id) return teacher;

        const teachesSubject = await TeacherSubject.findOne({
            where: { teacherId: teacher.id, subjectId },
        });
        if (!teachesSubject) {
            this.raiseBusinessRuleError(
                operation,
                'El docente no está asignado a la asignatura del examen.',
                {
                    entity: 'Subject',
                    code: 'TEACHER_NOT_IN_SUBJECT',
                },
            );
        }

        return teacher;
    }

    private async getSubjectLeaderForValidation(
        operation: string,
        subjectId: string,
    ): Promise<TeacherPlain> {
        const subject = await Subject.findByPk(subjectId);
        if (!subject) {
            this.raiseNotFoundError(operation, 'La asignatura asociada al examen no existe.', {
                entity: 'Subject',
            });
        }
        const subjectPlain = subject.get({ plain: true }) as SubjectPlain;
        if (!subjectPlain.leadTeacherId) {
            this.raiseBusinessRuleError(
                operation,
                'La asignatura no tiene un jefe asignado para validar el examen.',
                {
                    entity: 'Subject',
                    code: 'SUBJECT_WITHOUT_LEADER',
                },
            );
        }

        const leader = await Teacher.findByPk(subjectPlain.leadTeacherId);
        if (!leader) {
            this.raiseNotFoundError(operation, 'El jefe de asignatura no existe.', {
                entity: 'Teacher',
            });
        }

        return leader.get({ plain: true }) as TeacherPlain;
    }

    async createManualExam(input: CreateManualExamCommandSchema): Promise<ExamDetailRead> {
        const teacher = await this.getTeacherByUserId('createManualExam', input.authorId);
        const targetCount = input.questions.length;
        const questions = this.ensureQuestionsPayload(
            input.questions,
            targetCount,
            'createManualExam',
        );
        const catalog = await this.fetchQuestionsOrFail(
            questions.map((q) => q.questionId),
            'createManualExam',
        );

        const derivedDifficulty = this.deriveDifficultyFromCatalog(catalog);
        const topicProportion = this.computeTopicProportion(catalog);
        const topicCoverage = this.buildCoverageFromManual(
            input.subjectId,
            derivedDifficulty,
            questions.map((q) => q.questionId),
        );

        const created = await this.deps.examRepo.create({
            title: input.title,
            subjectId: input.subjectId,
            difficulty: derivedDifficulty,
            examStatus: ExamStatusEnum.DRAFT,
            active: true,
            authorId: teacher.id,
            validatorId: null,
            observations: null,
            questionCount: targetCount,
            topicProportion,
            topicCoverage,
        });

        await this.deps.examQuestionRepo.replaceExamQuestions(created.id, questions);

        return this.getExamDetailOrFail(created.id, 'createManualExam');
    }

    async createAutomaticExam(
        input: CreateAutomaticExamCommandSchema,
    ): Promise<AutomaticExamPreview> {
        const teacher = await this.getTeacherByUserId('createAutomaticExam', input.authorId);
        const derivedDifficulty = this.deriveDifficultyFromDistribution(input.difficultyCounts);
        const selectionPlan = this.buildSelectionPlan(
            'createAutomaticExam',
            input.questionCount,
            input.questionTypeCounts,
            input.difficultyCounts,
        );
        const selected: QuestionForExam[] = [];
        const used = new Set<string>();
        const topicIds = input.topicIds;
        const subtopicIds = input.subtopicDistribution?.map((entry) => entry.subtopicId);

        for (const slot of selectionPlan) {
            const criteria: QuestionSearchCriteria = {
                subjectId: input.subjectId,
                difficulty: slot.difficulty,
                questionTypeIds: [slot.questionTypeId],
                topicIds,
                subtopicIds,
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
        const previewQuestions = shuffled.map((question, idx) => ({
            questionId: question.id,
            questionIndex: idx + 1,
            questionScore: 1,
            difficulty: question.difficulty,
            questionTypeId: question.questionTypeId,
            subTopicId: question.subTopicId,
            topicId: question.topicId,
            body: question.body,
            options: question.options ?? null,
            response: question.response ?? null,
        }));

        const topicProportion = this.computeTopicProportion(selected);
        const topicCoverage = this.buildCoverageFromAutomatic(input, derivedDifficulty);

        return {
            title: input.title,
            subjectId: input.subjectId,
            difficulty: derivedDifficulty,
            examStatus: ExamStatusEnum.DRAFT,
            authorId: teacher.id,
            validatorId: null,
            observations: null,
            questionCount: input.questionCount,
            topicProportion,
            topicCoverage,
            questions: previewQuestions,
        };
    }

    async updateExam(id: string, patch: UpdateExamCommandSchema): Promise<ExamDetailRead> {
        const existing = await this.getExamOrFail(id, 'updateExam');

        const dto: ExamUpdate = {
            examStatus: ExamStatusEnum.DRAFT,
            validatorId: null,
            validatedAt: null,
        };
        if (patch.title !== undefined) dto.title = patch.title;
        if (patch.observations !== undefined) dto.observations = patch.observations;
        let normalizedQuestions: ExamQuestionInput[] | null = null;
        if (patch.questions) {
            const targetCount = patch.questions.length;
            normalizedQuestions = this.ensureQuestionsPayload(
                patch.questions,
                targetCount,
                'updateExam',
            );
            const catalog = await this.fetchQuestionsOrFail(
                normalizedQuestions.map((q) => q.questionId),
                'updateExam',
            );
            const derivedDifficulty = this.deriveDifficultyFromCatalog(catalog);
            if (dto.topicProportion === undefined) {
                dto.topicProportion = this.computeTopicProportion(catalog);
            }
            if (dto.topicCoverage === undefined) {
                dto.topicCoverage = {
                    mode: 'manual-update',
                    subjectId: existing.subjectId,
                    difficulty: derivedDifficulty,
                    sourceQuestions: normalizedQuestions.map((q) => q.questionId),
                };
            }
            dto.questionCount = targetCount;
            dto.difficulty = derivedDifficulty;
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
        const exam = await this.deps.examRepo.get_by_id(id);
        if (!exam) {
            this.raiseNotFoundError('deleteExam', 'El examen no existe.', { entity: 'Exam' });
        }

        if (exam.examStatus === ExamStatusEnum.DRAFT) {
            return this.deps.examRepo.deleteById(id);
        }

        if (!exam.active) return true;

        const updated = await this.deps.examRepo.update(id, { active: false });
        return Boolean(updated);
    }

    async requestExamReview(examId: string, currentUserId: string): Promise<ExamDetailRead> {
        const exam = await this.getExamOrFail(examId, 'requestExamReview');
        if (exam.examStatus === ExamStatusEnum.UNDER_REVIEW) {
            this.raiseBusinessRuleError('requestExamReview', 'El examen ya está en revisión.', {
                entity: 'Exam',
                code: 'EXAM_ALREADY_UNDER_REVIEW',
            });
        }
        if (exam.examStatus === ExamStatusEnum.APPROVED) {
            this.raiseBusinessRuleError(
                'requestExamReview',
                'El examen ya fue aceptado; realice cambios para volver a solicitar revisión.',
                {
                    entity: 'Exam',
                    code: 'APPROVED_EXAM_CANNOT_BE_REVIEWED',
                },
            );
        }
        if (exam.examStatus === ExamStatusEnum.PUBLISHED) {
            this.raiseBusinessRuleError(
                'requestExamReview',
                'No es posible solicitar revisión de un examen publicado.',
                {
                    entity: 'Exam',
                    code: 'PUBLISHED_EXAM_CANNOT_BE_REVIEWED',
                },
            );
        }
        await this.ensureExaminerForExam('requestExamReview', exam.subjectId, currentUserId);
        const validator = await this.getSubjectLeaderForValidation(
            'requestExamReview',
            exam.subjectId,
        );
        await this.deps.examRepo.update(examId, {
            examStatus: ExamStatusEnum.UNDER_REVIEW,
            validatorId: validator.id,
            validatedAt: null,
        });
        return this.getExamDetailOrFail(examId, 'requestExamReview');
    }

    async acceptExam(
        examId: string,
        currentUserId: string,
        comment?: string,
    ): Promise<ExamDetailRead> {
        const exam = await this.getExamOrFail(examId, 'acceptExam');
        if (exam.examStatus !== ExamStatusEnum.UNDER_REVIEW) {
            this.raiseBusinessRuleError(
                'acceptExam',
                'Solo se pueden aceptar exámenes en revisión.',
                {
                    entity: 'Exam',
                    code: 'EXAM_NOT_UNDER_REVIEW',
                },
            );
        }
        await this.ensureSubjectLeaderForExam('acceptExam', exam.subjectId, currentUserId);
        const updatePayload: ExamUpdate = {
            examStatus: ExamStatusEnum.APPROVED,
            validatedAt: new Date(),
        };
        if (comment !== undefined) {
            updatePayload.observations = comment;
        }
        await this.deps.examRepo.update(examId, updatePayload);
        return this.getExamDetailOrFail(examId, 'acceptExam');
    }

    async rejectExam(
        examId: string,
        currentUserId: string,
        comment?: string,
    ): Promise<ExamDetailRead> {
        const exam = await this.getExamOrFail(examId, 'rejectExam');
        if (exam.examStatus !== ExamStatusEnum.UNDER_REVIEW) {
            this.raiseBusinessRuleError(
                'rejectExam',
                'Solo se pueden rechazar exámenes en revisión.',
                {
                    entity: 'Exam',
                    code: 'EXAM_NOT_UNDER_REVIEW',
                },
            );
        }
        await this.ensureSubjectLeaderForExam('rejectExam', exam.subjectId, currentUserId);
        const updatePayload: ExamUpdate = {
            examStatus: ExamStatusEnum.REJECTED,
            validatedAt: new Date(),
        };
        if (comment !== undefined) {
            updatePayload.observations = comment;
        }
        await this.deps.examRepo.update(examId, updatePayload);
        return this.getExamDetailOrFail(examId, 'rejectExam');
    }
}
