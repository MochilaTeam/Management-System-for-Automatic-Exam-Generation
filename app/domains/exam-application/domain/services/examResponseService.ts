import { BaseDomainService } from '../../../../shared/domain/base_service';
import {
    BusinessRuleError,
    ForbiddenError,
    NotFoundError,
} from '../../../../shared/exceptions/domainErrors';
import { IExamQuestionRepository } from '../../../exam-generation/domain/ports/IExamQuestionRepository';
import { IQuestionRepository } from '../../../question-bank/domain/ports/IQuestionRepository';
import { IStudentRepository } from '../../../user/domain/ports/IStudentRepository';
import { QuestionDetail } from '../../../question-bank/schemas/questionSchema';
import { AssignedExamStatus } from '../../entities/enums/AssignedExamStatus'; //TODO: CAMBIAR LOS ENUMS DE LUGAR
import {
    CreateExamResponseCommandSchema,
    ExamResponseOutput,
    GetExamResponseByIndexQuerySchema,
    UpdateExamResponseCommandSchema,
} from '../../schemas/examResponseSchema';
import { IExamAssignmentRepository } from '../ports/IExamAssignmentRepository';
import { IExamResponseRepository } from '../ports/IExamResponseRepository';

type Deps = {
    examResponseRepo: IExamResponseRepository;
    examAssignmentRepo: IExamAssignmentRepository;
    questionRepo: IQuestionRepository;
    studentRepo: IStudentRepository;
    examQuestionRepo: IExamQuestionRepository;
};

export class ExamResponseService extends BaseDomainService {
    private readonly examResponseRepo: IExamResponseRepository;
    private readonly examAssignmentRepo: IExamAssignmentRepository;
    private readonly questionRepo: IQuestionRepository;
    private readonly studentRepo: IStudentRepository;
    private readonly examQuestionRepo: IExamQuestionRepository;

    constructor({
        examResponseRepo,
        examAssignmentRepo,
        questionRepo,
        studentRepo,
        examQuestionRepo,
    }: Deps) {
        super();
        this.examResponseRepo = examResponseRepo;
        this.examAssignmentRepo = examAssignmentRepo;
        this.questionRepo = questionRepo;
        this.studentRepo = studentRepo;
        this.examQuestionRepo = examQuestionRepo;
    }

    async createExamResponse(input: CreateExamResponseCommandSchema): Promise<ExamResponseOutput> {
        const operation = 'create-exam-response';
        this.logOperationStart(operation);

        const student = await this.getStudentByUserId(input.user_id);
        const assignment = await this.getAssignmentOrThrow(input.examId, student.id);
        this.ensureAssignmentIsActive(assignment);

        const questionDetail = await this.getQuestionDetailFromExamQuestion(input.examQuestionId);
        const autoPoints = this.calculateAutoPoints(questionDetail, input.selectedOptions);

        const response = await this.examResponseRepo.create({
            examId: input.examId,
            examQuestionId: input.examQuestionId,
            studentId: student.id,
            selectedOptions: input.selectedOptions || null,
            textAnswer: input.textAnswer || null,
            autoPoints,
            manualPoints: null,
            answeredAt: new Date(), // actual date
        });
        this.logOperationSuccess(operation);
        return response;
    }

    async updateExamResponse(input: UpdateExamResponseCommandSchema): Promise<ExamResponseOutput> {
        const operation = 'update-exam-response';
        this.logOperationStart(operation);

        const student = await this.getStudentByUserId(input.user_id);
        const response = await this.examResponseRepo.findById(input.responseId);
        if (!response) {
            throw new NotFoundError({ message: 'No se encontró la respuesta' });
        }
        if (response.studentId !== student.id) {
            throw new ForbiddenError({ message: 'No puedes modificar esta respuesta' });
        }

        const assignment = await this.getAssignmentOrThrow(response.examId, student.id);
        this.ensureAssignmentIsActive(assignment);

        const questionDetail = await this.getQuestionDetailFromExamQuestion(response.examQuestionId);
        const autoPoints = this.calculateAutoPoints(questionDetail, input.selectedOptions);

        const updated = await this.examResponseRepo.update({
            responseId: response.id,
            selectedOptions: input.selectedOptions ?? null,
            textAnswer: input.textAnswer ?? null,
            autoPoints,
            answeredAt: new Date(),
        });

        this.logOperationSuccess(operation);
        return updated;
    }

    async getResponseByQuestionIndex(
        input: GetExamResponseByIndexQuerySchema,
    ): Promise<ExamResponseOutput> {
        const operation = 'get-exam-response-by-index';
        this.logOperationStart(operation);

        const student = await this.getStudentByUserId(input.user_id);
        await this.getAssignmentOrThrow(input.examId, student.id);

        const examQuestion = await this.examQuestionRepo.findByExamIdAndIndex(
            input.examId,
            input.questionIndex,
        );
        if (!examQuestion) {
            throw new NotFoundError({ message: 'No se encontró la pregunta solicitada' });
        }

        const response = await this.examResponseRepo.findByExamQuestionAndStudent(
            examQuestion.id,
            student.id,
        );

        if (!response) {
            throw new NotFoundError({ message: 'Aún no hay respuesta registrada para esta pregunta' });
        }

        this.logOperationSuccess(operation);
        return response;
    }

    private calculateAutoPoints(
        question: QuestionDetail,
        selectedOptionsInput: { text: string; isCorrect: boolean }[] | null | undefined,
    ): number | null {
        if (question.options && question.options.length > 0) {
            const correctOptionsSet = new Set(
                question.options.filter((o) => o.isCorrect).map((o) => o.text),
            );

            const selectedOptions = selectedOptionsInput
                ? selectedOptionsInput.map((o) => o.text)
                : [];

            let score = 0;
            for (const selected of selectedOptions) {
                if (correctOptionsSet.has(selected)) {
                    score += 1;
                } else {
                    score -= 1;
                }
            }

            return score;
        }

        return null;
    }

    private async getQuestionDetailFromExamQuestion(examQuestionId: string): Promise<QuestionDetail> {
        const examQuestion = await this.examQuestionRepo.getById(examQuestionId);
        if (!examQuestion) {
            throw new NotFoundError({ message: 'Pregunta del examen no encontrada' });
        }

        const question = await this.questionRepo.get_detail_by_id(examQuestion.questionId);
        if (!question) {
            throw new NotFoundError({ message: 'Pregunta no encontrada' });
        }

        return question;
    }

    private async getStudentByUserId(userId: string) {
        const students = await this.studentRepo.list({
            filters: { userId },
            limit: 1,
        });
        const student = students[0];
        if (!student) {
            throw new NotFoundError({ message: 'No se encontró el estudiante' });
        }
        return student;
    }

    private async getAssignmentOrThrow(examId: string, studentId: string) {
        const examAssignment = await this.examAssignmentRepo.findByExamIdAndStudentId(
            examId,
            studentId,
        );
        if (!examAssignment) {
            throw new NotFoundError({ message: 'No se encontró la asignacion del examen' });
        }
        return examAssignment;
    }

    private ensureAssignmentIsActive(assignment: { status: AssignedExamStatus }) {
        const allowedStatuses = [
            AssignedExamStatus.ENABLED,
            AssignedExamStatus.DURING_SOLUTION,
        ];
        if (!allowedStatuses.includes(assignment.status)) {
            throw new BusinessRuleError({ message: 'El examen no se encuentra activo' });
        }
    }
}
