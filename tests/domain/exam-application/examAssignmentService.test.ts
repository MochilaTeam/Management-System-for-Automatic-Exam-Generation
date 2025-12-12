import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';

import { ExamAssignmentService } from '../../../app/domains/exam-application/domain/services/examAssigmentService';
import { AssignedExamStatus } from '../../../app/domains/exam-application/entities/enums/AssignedExamStatus';
import { ExamStatusEnum } from '../../../app/domains/exam-application/entities/enums/ExamStatusEnum';
import { ExamRegradesStatus } from '../../../app/domains/exam-application/entities/enums/ExamRegradeStatus';

const makeExamAssignmentRepo = () =>
  ({
    createExamAssignment: vi.fn(),
    listStudentExamAssignments: vi.fn(),
    findByExamIdAndStudentId: vi.fn(),
    updateStatus: vi.fn(),
    findDetailedById: vi.fn(),
    listAssignmentsForStatusRefresh: vi.fn(),
    updateGrade: vi.fn(),
  } as any);

const makeExamRepo = () =>
  ({
    get_by_id: vi.fn(),
    update: vi.fn(),
  } as any);

const makeTeacherRepo = () =>
  ({
    list: vi.fn(),
    get_by_id: vi.fn(),
  } as any);

const makeTeacherSubjectLinkRepo = () =>
  ({
    getAssignments: vi.fn(),
  } as any);

const makeStudentRepo = () =>
  ({
    list: vi.fn(),
  } as any);

const makeExamResponseRepo = () =>
  ({
    findById: vi.fn(),
    listByExamAndStudent: vi.fn(),
    studentHasResponses: vi.fn(),
  } as any);

const makeExamRegradeRepo = () =>
  ({
    findActiveByExamAndStudent: vi.fn(),
    create: vi.fn(),
    listPendingByProfessor: vi.fn(),
    findById: vi.fn(),
    resolve: vi.fn(),
  } as any);

const makeExamQuestionRepo = () =>
  ({
    listByExamId: vi.fn(),
  } as any);

beforeAll(() => {
  vi.spyOn(ExamAssignmentService.prototype as any, 'raiseBusinessRuleError').mockImplementation(
    (...args: any[]) => {
      const message = args[1] ?? 'BUSINESS_RULE_ERROR';
      throw new Error(message);
    },
  );
  vi.spyOn(ExamAssignmentService.prototype as any, 'raiseNotFoundError').mockImplementation(
    (...args: any[]) => {
      const message = args[1] ?? 'NOT_FOUND';
      throw new Error(message);
    },
  );
  vi.spyOn(ExamAssignmentService.prototype as any, 'logOperationStart').mockImplementation(
    () => {},
  );
  vi.spyOn(ExamAssignmentService.prototype as any, 'logOperationSuccess').mockImplementation(
    () => {},
  );
  vi.spyOn(ExamAssignmentService.prototype as any, 'logOperationError').mockImplementation(
    () => {},
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ExamAssignmentService', () => {
  const makeService = () => {
    const examAssignmentRepo = makeExamAssignmentRepo();
    const examRepo = makeExamRepo();
    const teacherRepo = makeTeacherRepo();
    const teacherSubjectLinkRepo = makeTeacherSubjectLinkRepo();
    const studentRepo = makeStudentRepo();
    const examResponseRepo = makeExamResponseRepo();
    const examRegradeRepo = makeExamRegradeRepo();
    const examQuestionRepo = makeExamQuestionRepo();
    const service = new ExamAssignmentService({
      examAssignmentRepo,
      examRepo,
      teacherRepo,
      teacherSubjectLinkRepo,
      studentRepo,
      examResponseRepo,
      examRegradeRepo,
      examQuestionRepo,
    });
    return {
      service,
      examAssignmentRepo,
      examRepo,
      teacherRepo,
      teacherSubjectLinkRepo,
      studentRepo,
      examResponseRepo,
      examRegradeRepo,
      examQuestionRepo,
    };
  };

  it('createExamAssignment: valida examen/aprobación y asigna a estudiantes', async () => {
    const {
      service,
      examAssignmentRepo,
      examRepo,
      teacherRepo,
      teacherSubjectLinkRepo,
      studentRepo,
    } = makeService();

    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.APPROVED,
    });
    teacherRepo.list.mockResolvedValue([{ id: 'teacher-1' }]);
    teacherSubjectLinkRepo.getAssignments.mockResolvedValue({
      teachingSubjectIds: ['sub-1'],
      leadSubjectIds: [],
      leadSubjectNames: [],
      teachingSubjectNames: [],
    });
    studentRepo.list.mockResolvedValue([
      { id: 'stu-1' },
      { id: 'stu-2' },
    ]);

    const applicationDate = new Date('2024-01-01T10:00:00Z');
    const result = await service.createExamAssignment(
      'exam-1',
      ['stu-1', 'stu-1', 'stu-2'],
      'user-1',
      applicationDate,
      90,
    );

    expect(examRepo.get_by_id).toHaveBeenCalledWith('exam-1');
    expect(studentRepo.list).toHaveBeenCalledWith({
      filters: { studentIds: ['stu-1', 'stu-2'] },
      limit: 2,
      offset: 0,
    });
    expect(examAssignmentRepo.createExamAssignment).toHaveBeenCalledTimes(2);
    expect(examRepo.update).toHaveBeenCalledWith('exam-1', {
      examStatus: ExamStatusEnum.PUBLISHED,
    });
    expect(result.assignedStudentIds).toEqual(['stu-1', 'stu-2']);
    expect(result.examStatus).toBe(ExamStatusEnum.PUBLISHED);
    expect(result.applicationDate).toBe(applicationDate);
  });

  it('createExamAssignment: falla si el examen no está aprobado', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue({
      id: 'exam-1',
      subjectId: 'sub-1',
      examStatus: ExamStatusEnum.DRAFT,
    });

    await expect(
      service.createExamAssignment('exam-1', [], 'user-1', new Date(), 60),
    ).rejects.toThrow('EXAMEN NO APROBADO AUN');
  });

  it('listStudentExams: refresca estados y calcula offset desde page', async () => {
    const {
      service,
      examAssignmentRepo,
      studentRepo,
      examResponseRepo,
      examQuestionRepo,
    } = makeService();

    studentRepo.list.mockResolvedValue([{ id: 'stu-1' }]);
    examAssignmentRepo.listAssignmentsForStatusRefresh.mockResolvedValue([
      {
        id: 'assign-1',
        examId: 'exam-1',
        studentId: 'stu-1',
        status: AssignedExamStatus.ENABLED,
        applicationDate: new Date('2023-01-01T00:00:00Z'),
        durationMinutes: 30,
        grade: null,
      },
    ]);
    examResponseRepo.studentHasResponses.mockResolvedValue(false);
    examQuestionRepo.listByExamId.mockResolvedValue([]);
    examAssignmentRepo.listStudentExamAssignments.mockResolvedValue({
      items: [],
      total: 0,
    });

    const res = await service.listStudentExams({
      currentUserId: 'user-1',
      page: 2,
      limit: 5,
    } as any);

    expect(examAssignmentRepo.updateStatus).toHaveBeenCalledWith(
      'assign-1',
      AssignedExamStatus.IN_EVALUATION,
    );
    expect(examAssignmentRepo.listStudentExamAssignments).toHaveBeenCalledWith({
      offset: 5,
      limit: 5,
      filters: {
        studentId: 'stu-1',
        status: undefined,
        subjectId: undefined,
        teacherId: undefined,
      },
    });
    expect(res).toEqual({ items: [], total: 0 });
  });

  it('calculateExamGrade: valida docente y calcula nota final', async () => {
    const {
      service,
      examAssignmentRepo,
      examResponseRepo,
      examQuestionRepo,
      teacherRepo,
    } = makeService();

    teacherRepo.list.mockResolvedValue([{ id: 't-1' }]);
    examResponseRepo.findById.mockResolvedValue({
      id: 'resp-1',
      examId: 'exam-1',
      studentId: 'stu-1',
    });
    examAssignmentRepo.findDetailedById.mockResolvedValue({
      id: 'assign-1',
      examId: 'exam-1',
      studentId: 'stu-1',
      teacherId: 't-1',
      status: AssignedExamStatus.IN_EVALUATION,
    });
    examQuestionRepo.listByExamId.mockResolvedValue([
      { id: 'eq-1', questionScore: 2 },
      { id: 'eq-2', questionScore: 3 },
    ]);
    examResponseRepo.listByExamAndStudent.mockResolvedValue([
      { examQuestionId: 'eq-1', manualPoints: 1, autoPoints: null },
      { examQuestionId: 'eq-2', manualPoints: null, autoPoints: 5 },
    ]);

    const res = await service.calculateExamGrade({
      currentUserId: 'user-1',
      responseId: 'resp-1',
    } as any);

    expect(examAssignmentRepo.updateGrade).toHaveBeenCalledWith('assign-1', {
      grade: 4,
      status: AssignedExamStatus.GRADED,
    });
    expect(res.finalGrade).toBe(4);
    expect(res.examTotalScore).toBe(5);
  });

  it('resolveExamRegrade: recalcula nota y resuelve la solicitud', async () => {
    const {
      service,
      teacherRepo,
      examRegradeRepo,
      examAssignmentRepo,
      examQuestionRepo,
      examResponseRepo,
    } = makeService();

    teacherRepo.list.mockResolvedValue([{ id: 't-1' }]);
    examRegradeRepo.findById.mockResolvedValue({
      id: 'regrade-1',
      examId: 'exam-1',
      studentId: 'stu-1',
      professorId: 't-1',
      status: ExamRegradesStatus.REQUESTED,
    });
    examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
      id: 'assign-1',
      examId: 'exam-1',
      studentId: 'stu-1',
      teacherId: 't-1',
      status: AssignedExamStatus.REGRADING,
    });
    examQuestionRepo.listByExamId.mockResolvedValue([
      { id: 'eq-1', questionScore: 5 },
    ]);
    examResponseRepo.listByExamAndStudent.mockResolvedValue([
      { examQuestionId: 'eq-1', manualPoints: 5, autoPoints: null },
    ]);

    const res = await service.resolveExamRegrade({
      regradeId: 'regrade-1',
      currentUserId: 'user-1',
    });

    expect(examAssignmentRepo.updateGrade).toHaveBeenCalledWith('assign-1', {
      grade: 5,
      status: AssignedExamStatus.REGRADED,
    });
    expect(examRegradeRepo.resolve).toHaveBeenCalledWith('regrade-1', {
      status: ExamRegradesStatus.RESOLVED,
      resolvedAt: expect.any(Date),
      finalGrade: 5,
    });
    expect(res.finalGrade).toBe(5);
  });
});
