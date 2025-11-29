import { AssignedExamStatus } from '../../../../infrastructure/exam-application/enums/AssignedExamStatus'; //TODO: CAMBIAR LOS ENUMS DE LUGAR
import { BaseDomainService } from '../../../../shared/domain/base_service';
import { BusinessRuleError, NotFoundError } from '../../../../shared/exceptions/domainErrors';
import { IQuestionRepository } from '../../../question-bank/domain/ports/IQuestionRepository';
import { IStudentRepository } from '../../../user/domain/ports/IStudentRepository';
import {
    CreateExamResponseCommandSchema,
    ExamResponseOutput,
} from '../../schemas/examResponseSchema';
import { IExamAssignmentRepository } from '../ports/IExamAssignmentRepository';
import { IExamResponseRepository } from '../ports/IExamResponseRepository';

type Deps = {
    examResponseRepo: IExamResponseRepository;
    examAssignmentRepo: IExamAssignmentRepository;
    questionRepo: IQuestionRepository;
    studentRepo: IStudentRepository;
};

export class ExamResponseService extends BaseDomainService {
    private readonly examResponseRepo: IExamResponseRepository;
    private readonly examAssignmentRepo: IExamAssignmentRepository;
    private readonly questionRepo: IQuestionRepository;
    private readonly studentRepo: IStudentRepository;

    constructor({ examResponseRepo, examAssignmentRepo, questionRepo, studentRepo }: Deps) {
        super();
        this.examResponseRepo = examResponseRepo;
        this.examAssignmentRepo = examAssignmentRepo;
        this.questionRepo = questionRepo;
        this.studentRepo = studentRepo;
    }

    async createExamResponse(input: CreateExamResponseCommandSchema): Promise<ExamResponseOutput> {
        const operation = 'create-exam-response';
        this.logOperationStart(operation);

        const userId = input.user_id;
        const students = await this.studentRepo.list({
            filters: { userId },
            limit: 1,
        });
        const student = students[0];
        if (!student) {
            throw new NotFoundError({ message: 'No se encontró el estudiante' });
        }

        const examAssignment = await this.examAssignmentRepo.findByExamIdAndStudentId(
            input.examId,
            student.id,
        );
        if (!examAssignment) {
            throw new NotFoundError({ message: 'No se encontró la asignacion del examen' });
        }
        if (examAssignment.status !== AssignedExamStatus.ENABLED) {
            throw new BusinessRuleError({ message: 'El examen no se encuentra activo' });
        }

        const autoPoints = await this.calculateAutoPoints(
            input.examQuestionId,
            input.selectedOptions,
        );

        const response = await this.examResponseRepo.create({
            examId: input.examId,
            examQuestionId: input.examQuestionId,
            studentId: student.id,
            selectedOptions: input.selectedOptions || null,
            textAnswer: input.textAnswer || null,
            autoPoints: autoPoints,
            manualPoints: null,
            answeredAt: new Date(), // actual date
        });
        this.logOperationSuccess(operation);
        return response;
    }

    private async calculateAutoPoints(
        examQuestionId: string,
        selectedOptionsInput: { text: string; isCorrect: boolean }[] | null | undefined,
    ): Promise<number | null> {
        const question = await this.questionRepo.get_detail_by_id(examQuestionId);

        if (!question) {
            throw new NotFoundError({ message: `Pregunta no encontrada` });
        }

        // Check if question has options (implies MCQ or True/False)
        if (question.options && question.options.length > 0) {
            const correctOptionsSet = new Set(
                question.options.filter((o) => o.isCorrect).map((o) => o.text),
            );
            // Input selectedOptions might be null/undefined, default to empty array
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
}
