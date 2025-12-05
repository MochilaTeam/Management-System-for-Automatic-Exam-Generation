import ExamQuestionModel from '../../../../infrastructure/exam-generation/models/ExamQuestion';
import QuestionTypeModel from '../../../../infrastructure/question-bank/models/QuestionType';
import SubjectModel from '../../../../infrastructure/question-bank/models/Subject';
import SubjectTopicModel from '../../../../infrastructure/question-bank/models/SubjectTopic';
import SubtopicModel from '../../../../infrastructure/question-bank/models/SubTopic';
import TeacherSubjectModel from '../../../../infrastructure/question-bank/models/TeacherSubject';
import { Teacher } from '../../../../infrastructure/user/models';
import { BaseDomainService } from '../../../../shared/domain/base_service';
import { DifficultyLevelEnum } from '../../entities/enums/DifficultyLevels';
import { QuestionTypeEnum } from '../../entities/enums/QuestionType';
import {
    CreateQuestionBody,
    ListQuestions,
    QuestionCreate,
    QuestionDetail,
    QuestionUpdate,
    UpdateQuestionBody,
    questionCreateSchema,
    questionUpdateSchema,
} from '../../schemas/questionSchema';
import { IQuestionRepository, ListQuestionsCriteria } from '../ports/IQuestionRepository';
import { ISubjectRepository } from '../ports/ISubjectRepository';
import { ISubtopicRepository } from '../ports/ISubtopicRepository';

type Deps = {
    questionRepo: IQuestionRepository;
    subtopicRepo: ISubtopicRepository;
    subjectRepo: ISubjectRepository;
};

type TeacherPlain = {
    id: string;
    userId: string;
    hasRoleSubjectLeader: boolean;
};

type SubtopicPlain = { id: string; topicId: string };
type SubjectTopicPlain = { subjectId: string; topicId: string };
type SubjectPlain = { id: string; leadTeacherId: string | null };
type TeacherSubjectPlain = { teacherId: string; subjectId: string };

export class QuestionService extends BaseDomainService {
    public readonly repo: IQuestionRepository;
    private readonly subtopicRepo: ISubtopicRepository;
    private readonly subjectRepo: ISubjectRepository;

    constructor(deps: Deps) {
        super();
        this.repo = deps.questionRepo;
        this.subtopicRepo = deps.subtopicRepo;
        this.subjectRepo = deps.subjectRepo;
    }

    private norm(s: string) {
        return s.trim();
    }

    // ===== Helpers de permisos =====

    private async getTeacherByUserId(operation: string, userId: string): Promise<TeacherPlain> {
        const row = await Teacher.findOne({ where: { userId } });
        if (!row) {
            this.raiseBusinessRuleError(operation, 'TEACHER_PROFILE_NOT_FOUND', {
                entity: 'Teacher',
                code: 'TEACHER_NOT_FOUND',
            });
        }
        const p = row.get({ plain: true }) as TeacherPlain;
        return p;
    }

    private async getSubjectIdsForSubtopic(
        operation: string,
        subtopicId: string,
    ): Promise<string[]> {
        const sub = await SubtopicModel.findByPk(subtopicId);
        if (!sub) {
            this.raiseNotFoundError(operation, 'SUBTOPIC_NOT_FOUND', { entity: 'Subtopic' });
        }
        const sp = sub.get({ plain: true }) as SubtopicPlain;

        const subjectTopics = await SubjectTopicModel.findAll({ where: { topicId: sp.topicId } });
        const stPlain = subjectTopics.map((st) => st.get({ plain: true }) as SubjectTopicPlain);
        return stPlain.map((st) => st.subjectId);
    }

    private async getTeacherSubjectIds(teacherId: string): Promise<string[]> {
        const rows = await TeacherSubjectModel.findAll({ where: { teacherId } });
        const plain = rows.map((r) => r.get({ plain: true }) as TeacherSubjectPlain);
        return plain.map((p) => p.subjectId);
    }

    private async ensureTeacherCanCreateQuestion(
        currentUserId: string,
        subtopicId: string,
    ): Promise<{ teacher: TeacherPlain; subjectIds: string[]; allowedSubjectIds: string[] }> {
        const operation = 'create-question';

        const teacher = await this.getTeacherByUserId(operation, currentUserId);
        const subjectIds = await this.getSubjectIdsForSubtopic(operation, subtopicId);
        if (subjectIds.length === 0) {
            this.raiseBusinessRuleError(operation, 'SUBTOPIC_WITHOUT_SUBJECT', {
                entity: 'Subtopic',
                code: 'NO_SUBJECT_FOR_SUBTOPIC',
            });
        }

        const teacherSubjectIds = await this.getTeacherSubjectIds(teacher.id);
        const allowedSubjectIds = subjectIds.filter((id) => teacherSubjectIds.includes(id));
        if (allowedSubjectIds.length === 0) {
            this.raiseBusinessRuleError(operation, 'TEACHER_NOT_ASSIGNED_TO_SUBJECT', {
                entity: 'Subject',
                code: 'TEACHER_NOT_IN_SUBJECT',
            });
        }

        return { teacher, subjectIds, allowedSubjectIds };
    }

    private async ensureTeacherCanManageQuestion(
        operation: string,
        currentUserId: string,
        question: QuestionDetail,
    ): Promise<{ teacher: TeacherPlain; allowedSubjectIds: string[] }> {
        const teacher = await this.getTeacherByUserId(operation, currentUserId);

        // Debe impartir al menos una de las asignaturas asociadas al subtema
        const subjectIds = await this.getSubjectIdsForSubtopic(operation, question.subtopicId);
        const teacherSubjectIds = await this.getTeacherSubjectIds(teacher.id);
        const allowedSubjectIds = subjectIds.filter((id) => teacherSubjectIds.includes(id));

        if (allowedSubjectIds.length === 0) {
            this.raiseBusinessRuleError(operation, 'TEACHER_NOT_ASSIGNED_TO_SUBJECT', {
                entity: 'Subject',
                code: 'TEACHER_NOT_IN_SUBJECT',
            });
        }

        const isAuthor = question.authorId === teacher.id;

        // Verificamos si es jefe de alguna de las asignaturas asociadas
        let isSubjectLeader = false;
        if (teacher.hasRoleSubjectLeader) {
            const subjects = await SubjectModel.findAll({ where: { id: allowedSubjectIds } });
            const plain = subjects.map((s) => s.get({ plain: true }) as SubjectPlain);
            isSubjectLeader = plain.some((s) => s.leadTeacherId === teacher.id);
        }

        if (!isAuthor && !isSubjectLeader) {
            this.raiseBusinessRuleError(operation, 'FORBIDDEN_TO_MANAGE_QUESTION', {
                entity: 'Question',
                code: 'QUESTION_MANAGE_FORBIDDEN',
            });
        }

        return { teacher, allowedSubjectIds };
    }

    private async getAllowedSubtopicIdsForTeacher(
        operation: string,
        userId: string,
    ): Promise<Set<string>> {
        const teacher = await this.getTeacherByUserId(operation, userId);
        const teacherSubjectIds = await this.getTeacherSubjectIds(teacher.id);
        if (teacherSubjectIds.length === 0) return new Set<string>();

        const subjectTopics = await SubjectTopicModel.findAll({
            where: { subjectId: teacherSubjectIds },
        });
        if (subjectTopics.length === 0) return new Set<string>();

        const topicIds = subjectTopics.map((st) => {
            const p = st.get({ plain: true }) as SubjectTopicPlain;
            return p.topicId;
        });

        if (topicIds.length === 0) return new Set<string>();

        const subtopics = await SubtopicModel.findAll({ where: { topicId: topicIds } });
        const ids = subtopics.map((s) => {
            const p = s.get({ plain: true }) as SubtopicPlain;
            return p.id;
        });
        return new Set(ids);
    }

    // ===== Helpers de uso en exámenes =====

    private async isQuestionUsedInAnyExam(questionId: string): Promise<boolean> {
        const count = await ExamQuestionModel.count({ where: { questionId } });
        return count > 0;
    }

    // ===== Validaciones de tipo / opciones / respuesta =====

    private validateOptionsAndResponse(
        operation: string,
        typeName: QuestionTypeEnum,
        options: QuestionDetail['options'],
        response: QuestionDetail['response'],
    ) {
        if (typeName === QuestionTypeEnum.ESSAY) {
            if (options !== null && options !== undefined) {
                this.raiseBusinessRuleError(operation, 'ESSAY_CANNOT_HAVE_OPTIONS', {
                    entity: 'Question',
                    code: 'ESSAY_WITH_OPTIONS',
                });
            }
            return;
        }

        if (typeName === QuestionTypeEnum.MCQ) {
            if (!options || options.length === 0) {
                this.raiseBusinessRuleError(operation, 'MCQ_MUST_HAVE_OPTIONS', {
                    entity: 'Question',
                    code: 'MCQ_WITHOUT_OPTIONS',
                });
            }
            const correctCount = options.filter((o) => o.isCorrect).length;
            if (correctCount === 0) {
                this.raiseBusinessRuleError(operation, 'MCQ_MUST_HAVE_AT_LEAST_ONE_CORRECT', {
                    entity: 'Question',
                    code: 'MCQ_NO_CORRECT_OPTION',
                });
            }
            // response se puede usar como explicación; no imponemos formato adicional aquí.
            return;
        }

        if (typeName === QuestionTypeEnum.TRUE_FALSE) {
            if (!options || options.length === 0) {
                this.raiseBusinessRuleError(operation, 'TRUE_FALSE_MUST_HAVE_OPTIONS', {
                    entity: 'Question',
                    code: 'TRUE_FALSE_WITHOUT_OPTIONS',
                });
            }
            if (response !== null && response !== undefined) {
                const normalized = this.norm(response).toLowerCase();
                if (normalized !== 'true' && normalized !== 'false') {
                    this.raiseBusinessRuleError(
                        operation,
                        'TRUE_FALSE_RESPONSE_MUST_BE_TRUE_OR_FALSE',
                        { entity: 'Question', code: 'TRUE_FALSE_INVALID_RESPONSE' },
                    );
                }
            }
        }
    }

    // ===== Casos de uso =====

    async create(input: {
        body: CreateQuestionBody;
        currentUserId: string;
    }): Promise<QuestionDetail> {
        const operation = 'create-question';
        const { body, currentUserId } = input;

        const normalizedBody = this.norm(body.body);

        const { teacher } = await this.ensureTeacherCanCreateQuestion(
            currentUserId,
            body.subtopicId,
        );

        // Duplicados exactos por (body, subtema)
        const duplicated = await this.repo.existsByStatementAndSubtopic(
            normalizedBody,
            body.subtopicId,
        );
        if (duplicated) {
            this.raiseBusinessRuleError(operation, 'QUESTION_ALREADY_EXISTS_IN_SUBTOPIC', {
                entity: 'Question',
                code: 'QUESTION_DUPLICATED',
            });
        }

        // Validar tipo de pregunta
        const questionTypeRow = await QuestionTypeModel.findByPk(body.questionTypeId);
        if (!questionTypeRow) {
            this.raiseNotFoundError(operation, 'QUESTION_TYPE_NOT_FOUND', {
                entity: 'QuestionType',
            });
        }
        const qtPlain = questionTypeRow.get({
            plain: true,
        }) as { id: string; name: QuestionTypeEnum };

        this.validateOptionsAndResponse(operation, qtPlain.name, body.options, body.response);

        const dto: QuestionCreate = questionCreateSchema.parse({
            authorId: teacher.id,
            questionTypeId: body.questionTypeId,
            subTopicId: body.subtopicId,
            difficulty: body.difficulty as DifficultyLevelEnum,
            body: normalizedBody,
            options: body.options ?? null,
            response: body.response ?? null,
        });

        const created = await this.repo.create(dto);
        return created;
    }

    async paginateDetail(
        criteria: ListQuestions,
        currentUserId: string,
    ): Promise<{ list: QuestionDetail[]; total: number }> {
        const allowedSubtopics = await this.getAllowedSubtopicIdsForTeacher(
            'list-questions',
            currentUserId,
        );
        if (allowedSubtopics.size === 0) return { list: [], total: 0 };

        if (criteria.subtopicId && !allowedSubtopics.has(criteria.subtopicId)) {
            return { list: [], total: 0 };
        }

        const limit = criteria.limit ?? 20;
        const offset = criteria.offset ?? 0;
        const repoCriteria: ListQuestionsCriteria = {
            limit,
            offset,
            filters: {
                q: criteria.q,
                subtopicId: criteria.subtopicId,
                subtopicIds: criteria.subtopicId ? undefined : Array.from(allowedSubtopics),
                authorId: criteria.authorId,
                difficulty: criteria.difficulty,
                questionTypeId: criteria.questionTypeId,
            },
        };
        const { items, total } = await this.repo.paginateDetail(repoCriteria);
        return { list: items, total };
    }

    async get_detail_by_id(id: string): Promise<QuestionDetail | null> {
        const question = await this.repo.get_detail_by_id(id);
        if (!question) return null;
        return question;
    }

    async update(input: {
        questionId: string;
        patch: UpdateQuestionBody;
        currentUserId: string;
    }): Promise<QuestionDetail> {
        const operation = 'update-question';
        const { questionId, patch, currentUserId } = input;

        const current = await this.repo.get_detail_by_id(questionId);
        if (!current) {
            this.raiseNotFoundError(operation, 'QUESTION_NOT_FOUND', { entity: 'Question' });
        }

        await this.ensureTeacherCanManageQuestion(operation, currentUserId, current);

        const usedInAnyExam = await this.isQuestionUsedInAnyExam(questionId);

        // Estado “nuevo” después del patch
        const newBody = this.norm(patch.body ?? current.body);
        const newSubtopicId = patch.subtopicId ?? current.subtopicId;
        const newDifficulty = patch.difficulty ?? current.difficulty;
        const newQuestionTypeId = patch.questionTypeId ?? current.questionTypeId;
        const newOptions =
            patch.options !== undefined && patch.options !== null ? patch.options : current.options;
        const newResponse =
            patch.response !== undefined && patch.response !== null
                ? patch.response
                : current.response;

        // Validar duplicado exacto (body + subtema)
        if (usedInAnyExam) {
            const duplicated = await this.repo.existsByStatementAndSubtopicExceptId(
                newBody,
                newSubtopicId,
                questionId,
            );
            if (duplicated) {
                this.raiseBusinessRuleError(operation, 'QUESTION_ALREADY_EXISTS_IN_SUBTOPIC', {
                    entity: 'Question',
                    code: 'QUESTION_DUPLICATED',
                });
            }

            // Debe poder crear pregunta en el subtema resultante
            await this.ensureTeacherCanCreateQuestion(currentUserId, newSubtopicId);

            // Validar tipo de pregunta
            const questionTypeRow = await QuestionTypeModel.findByPk(newQuestionTypeId);
            if (!questionTypeRow) {
                this.raiseNotFoundError(operation, 'QUESTION_TYPE_NOT_FOUND', {
                    entity: 'QuestionType',
                });
            }
            const qtPlain = questionTypeRow.get({
                plain: true,
            }) as { id: string; name: QuestionTypeEnum };

            this.validateOptionsAndResponse(operation, qtPlain.name, newOptions, newResponse);

            // Crear nueva instancia con los cambios
            const dto: QuestionCreate = questionCreateSchema.parse({
                authorId: current.authorId,
                questionTypeId: newQuestionTypeId,
                subTopicId: newSubtopicId,
                difficulty: newDifficulty as DifficultyLevelEnum,
                body: newBody,
                options: newOptions ?? null,
                response: newResponse ?? null,
            });

            const created = await this.repo.create(dto);
            // Marcar original como inactiva
            await this.repo.softDeleteById(questionId);
            return created;
        }

        // Si no está en ningún examen, se actualiza in-place
        const duplicated = await this.repo.existsByStatementAndSubtopicExceptId(
            newBody,
            newSubtopicId,
            questionId,
        );
        if (duplicated) {
            this.raiseBusinessRuleError(operation, 'QUESTION_ALREADY_EXISTS_IN_SUBTOPIC', {
                entity: 'Question',
                code: 'QUESTION_DUPLICATED',
            });
        }

        // Validar tipo de pregunta
        const questionTypeRow = await QuestionTypeModel.findByPk(newQuestionTypeId);
        if (!questionTypeRow) {
            this.raiseNotFoundError(operation, 'QUESTION_TYPE_NOT_FOUND', {
                entity: 'QuestionType',
            });
        }
        const qtPlain = questionTypeRow.get({
            plain: true,
        }) as { id: string; name: QuestionTypeEnum };

        this.validateOptionsAndResponse(operation, qtPlain.name, newOptions, newResponse);

        const patchDto: QuestionUpdate = questionUpdateSchema.parse({
            questionTypeId: patch.questionTypeId,
            subTopicId: patch.subtopicId,
            difficulty: patch.difficulty as DifficultyLevelEnum | undefined,
            body: patch.body ? newBody : undefined,
            options: patch.options,
            response: patch.response,
        });

        const updated = await this.repo.update(questionId, patchDto);
        if (!updated) {
            this.raiseNotFoundError(operation, 'QUESTION_NOT_FOUND_AFTER_UPDATE', {
                entity: 'Question',
            });
        }
        return updated;
    }

    async deleteById(input: { questionId: string; currentUserId: string }): Promise<boolean> {
        const operation = 'delete-question';
        const { questionId, currentUserId } = input;

        const current = await this.repo.get_detail_by_id(questionId);
        if (!current) {
            this.raiseNotFoundError(operation, 'QUESTION_NOT_FOUND', { entity: 'Question' });
        }

        await this.ensureTeacherCanManageQuestion(operation, currentUserId, current);

        const usedInAnyExam = await this.isQuestionUsedInAnyExam(questionId);
        if (usedInAnyExam) {
            return this.repo.softDeleteById(questionId);
        }
        return this.repo.deleteHardById(questionId);
    }
}
