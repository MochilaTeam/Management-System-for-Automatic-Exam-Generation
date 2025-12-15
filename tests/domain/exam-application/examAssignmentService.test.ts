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
    create: vi.fn(),
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

  it('createExamAssignment: falla cuando el examen no existe', async () => {
    const { service, examRepo } = makeService();
    examRepo.get_by_id.mockResolvedValue(null);

    await expect(
      service.createExamAssignment('exam-1', ['stu-1'], 'user-1', new Date(), 30),
    ).rejects.toThrow('EXAMEN NO ENCONTRADO');
  });

  it('sendExamToEvaluator: solo permite estados habilitados', async () => {
    const { service, studentRepo, examAssignmentRepo } = makeService();

    studentRepo.list.mockResolvedValue([{ id: 'stu-1' }]);
    examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
      id: 'assign-1',
      status: AssignedExamStatus.ENABLED,
    });
    examAssignmentRepo.findDetailedById.mockResolvedValue({
      id: 'assign-1',
      status: AssignedExamStatus.IN_EVALUATION,
    });

    const result = await service.sendExamToEvaluator({
      examId: 'exam-1',
      currentUserId: 'user-1',
    } as any);

    expect(examAssignmentRepo.updateStatus).toHaveBeenCalledWith(
      'assign-1',
      AssignedExamStatus.IN_EVALUATION,
    );
    expect(result.status).toBe(AssignedExamStatus.IN_EVALUATION);

    examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
      id: 'assign-2',
      status: AssignedExamStatus.CANCELLED,
    });

    await expect(
      service.sendExamToEvaluator({ examId: 'exam-2', currentUserId: 'user-1' } as any),
    ).rejects.toThrow('EL EXAMEN NO ESTÁ LISTO PARA EVALUARSE');
  });

  it('listPendingExamRegrades: une asignaciones y omite faltantes', async () => {
    const {
      service,
      teacherRepo,
      examRegradeRepo,
      examAssignmentRepo,
    } = makeService();

    teacherRepo.list.mockResolvedValue([{ id: 't-1' }]);
    const requestedAt = new Date();
    examRegradeRepo.listPendingByProfessor.mockResolvedValue({
      items: [
        {
          id: 'reg-1',
          examId: 'exam-1',
          studentId: 'stu-1',
          status: ExamRegradesStatus.REQUESTED,
          reason: 'A',
          requestedAt,
        },
        {
          id: 'reg-2',
          examId: 'exam-2',
          studentId: 'stu-2',
          status: ExamRegradesStatus.REQUESTED,
          reason: 'B',
          requestedAt,
        },
      ],
      total: 2,
    });
    examAssignmentRepo.findByExamIdAndStudentId.mockImplementation((examId: string) =>
      examId === 'exam-1'
        ? {
            id: 'assign-1',
            examId: 'exam-1',
            studentId: 'stu-1',
            subjectId: 'sub-1',
            teacherId: 't-1',
            status: AssignedExamStatus.REGRADING,
          }
        : null,
    );

    const result = await service.listPendingExamRegrades({
      currentUserId: 'user-1',
      limit: 10,
      offset: 0,
    });

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'assign-1',
      regradeId: 'reg-1',
      regradeStatus: ExamRegradesStatus.REQUESTED,
    });
  });

  it('refreshStudentAssignmentsStatuses: crea respuestas faltantes y actualiza estado', async () => {
    const {
      service,
      examAssignmentRepo,
      examQuestionRepo,
      examResponseRepo,
    } = makeService();

    const pastDate = new Date(Date.now() - 10 * 60 * 1000);
    examAssignmentRepo.listAssignmentsForStatusRefresh.mockResolvedValue([
      {
        id: 'assign-1',
        examId: 'exam-1',
        studentId: 'stu-1',
        status: AssignedExamStatus.ENABLED,
        applicationDate: pastDate,
        durationMinutes: 1,
        grade: null,
      },
    ]);
    examQuestionRepo.listByExamId.mockResolvedValue([
      { id: 'eq-1', questionScore: 2 },
      { id: 'eq-2', questionScore: 3 },
    ]);
    examResponseRepo.listByExamAndStudent.mockResolvedValue([]);
    examResponseRepo.create.mockResolvedValue({});

    await (service as any).refreshStudentAssignmentsStatuses('stu-1');

    expect(examAssignmentRepo.updateStatus).toHaveBeenCalledWith(
      'assign-1',
      AssignedExamStatus.IN_EVALUATION,
    );
    expect(examResponseRepo.create).toHaveBeenCalledTimes(2);
  });

  it('calculateStatusForSnapshot: determina estados según fechas y notas', async () => {
    const { service } = makeService();
    const now = new Date('2024-01-01T12:00:00Z');

    const cancelled = await (service as any).calculateStatusForSnapshot(
      {
        status: AssignedExamStatus.CANCELLED,
        applicationDate: new Date('2024-01-01T10:00:00Z'),
        durationMinutes: 30,
        grade: null,
      },
      now,
    );
    const graded = await (service as any).calculateStatusForSnapshot(
      {
        status: AssignedExamStatus.ENABLED,
        applicationDate: new Date('2024-01-01T10:00:00Z'),
        durationMinutes: 30,
        grade: 15,
      },
      now,
    );
    const pending = await (service as any).calculateStatusForSnapshot(
      {
        status: AssignedExamStatus.ENABLED,
        applicationDate: new Date('2024-02-01T10:00:00Z'),
        durationMinutes: 30,
        grade: null,
      },
      now,
    );
    const enabled = await (service as any).calculateStatusForSnapshot(
      {
        status: AssignedExamStatus.ENABLED,
        applicationDate: new Date('2024-01-01T11:55:00Z'),
        durationMinutes: 0,
        grade: null,
      },
      now,
    );
    const inEvaluation = await (service as any).calculateStatusForSnapshot(
      {
        status: AssignedExamStatus.ENABLED,
        applicationDate: new Date('2024-01-01T11:00:00Z'),
        durationMinutes: 30,
        grade: null,
      },
      now,
    );

    expect(cancelled).toBe(AssignedExamStatus.CANCELLED);
    expect(graded).toBe(AssignedExamStatus.GRADED);
    expect(pending).toBe(AssignedExamStatus.PENDING);
    expect(enabled).toBe(AssignedExamStatus.ENABLED);
    expect(inEvaluation).toBe(AssignedExamStatus.IN_EVALUATION);
  });

  it('calculateExamGrade: valida preguntas configuradas y respuestas calificadas', async () => {
    const {
      service,
      teacherRepo,
      examAssignmentRepo,
      examQuestionRepo,
      examResponseRepo,
    } = makeService();

    teacherRepo.list.mockResolvedValue([{ id: 't-1' }]);
    examAssignmentRepo.findDetailedById.mockResolvedValue({
      id: 'assign-1',
      examId: 'exam-1',
      studentId: 'stu-1',
      teacherId: 't-1',
      status: AssignedExamStatus.IN_EVALUATION,
    });

    examQuestionRepo.listByExamId.mockResolvedValue([]);

    await expect(
      service.calculateExamGrade({ assignmentId: 'assign-1', currentUserId: 'user-1' } as any),
    ).rejects.toThrow('EL EXAMEN NO TIENE PREGUNTAS CONFIGURADAS');

    examQuestionRepo.listByExamId.mockResolvedValue([{ id: 'eq-1', questionScore: 0 }]);

    await expect(
      service.calculateExamGrade({ assignmentId: 'assign-1', currentUserId: 'user-1' } as any),
    ).rejects.toThrow('LA NOTA TOTAL DEL EXAMEN ES INVÁLIDA');

    examQuestionRepo.listByExamId.mockResolvedValue([{ id: 'eq-1', questionScore: 2 }]);
    examResponseRepo.listByExamAndStudent.mockResolvedValue([
      { id: 'resp-1', examQuestionId: 'eq-1', manualPoints: null, autoPoints: null },
    ]);

    await expect(
      service.calculateExamGrade({ assignmentId: 'assign-1', currentUserId: 'user-1' } as any),
    ).rejects.toThrow('AÚN HAY PREGUNTAS SIN CALIFICAR');
  });

  it('listStudentExams: lanza error cuando no se encuentra el estudiante', async () => {
    const { service, studentRepo } = makeService();
    studentRepo.list.mockResolvedValue([]);

    await expect(
      service.listStudentExams({ currentUserId: 'user-1', page: 1, limit: 5 } as any),
    ).rejects.toThrow('ESTUDIANTE NO ENCONTRADO');
  });

  it('listEvaluatorExams: calcula offset y delega al repositorio', async () => {
    const { service, teacherRepo, examAssignmentRepo } = makeService();
    teacherRepo.list.mockResolvedValue([{ id: 't-1' }]);
    examAssignmentRepo.listStudentExamAssignments.mockResolvedValue({ items: [{ id: 'a1' }], total: 1 });

    const result = await service.listEvaluatorExams({
      currentUserId: 'teacher-user',
      page: 2,
      limit: 10,
      subjectId: 'sub-1',
      examTitle: 'Midterm',
    } as any);

    expect(examAssignmentRepo.listStudentExamAssignments).toHaveBeenCalledWith({
      offset: 10,
      limit: 10,
      filters: {
        teacherId: 't-1',
        status: AssignedExamStatus.IN_EVALUATION,
        subjectId: 'sub-1',
        examTitle: 'Midterm',
        studentId: undefined,
      },
    });
    expect(result.items[0].id).toBe('a1');
  });

  it('requestExamRegrade: crea solicitud y cambia estado de la asignación', async () => {
    const {
      service,
      studentRepo,
      examAssignmentRepo,
      examRegradeRepo,
      teacherRepo,
      teacherSubjectLinkRepo,
    } = makeService();

    studentRepo.list.mockResolvedValue([{ id: 'stu-1' }]);
    examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
      id: 'assign-1',
      examId: 'exam-1',
      studentId: 'stu-1',
      subjectId: 'sub-1',
      status: AssignedExamStatus.GRADED,
    });
    examRegradeRepo.findActiveByExamAndStudent.mockResolvedValue(null);
    teacherRepo.get_by_id.mockResolvedValue({ id: 't-1' });
    teacherSubjectLinkRepo.getAssignments.mockResolvedValue({
      teachingSubjectIds: ['sub-1'],
      leadSubjectIds: [],
    });
    const createdRegrade = { id: 'reg-1' } as any;
    examRegradeRepo.create.mockResolvedValue(createdRegrade);

    const result = await service.requestExamRegrade({
      examId: 'exam-1',
      professorId: 't-1',
      currentUserId: 'user-1',
    } as any);

    expect(result).toBe(createdRegrade);
    expect(examAssignmentRepo.updateStatus).toHaveBeenCalledWith(
      'assign-1',
      AssignedExamStatus.REGRADING,
    );
  });

  it('requestExamRegrade: rechaza cuando ya existe una solicitud activa o el profesor no está asignado', async () => {
    const {
      service,
      studentRepo,
      examAssignmentRepo,
      examRegradeRepo,
      teacherRepo,
      teacherSubjectLinkRepo,
    } = makeService();

    studentRepo.list.mockResolvedValue([{ id: 'stu-1' }]);
    examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue({
      id: 'assign-1',
      examId: 'exam-1',
      studentId: 'stu-1',
      subjectId: 'sub-1',
      status: AssignedExamStatus.GRADED,
    });
    examRegradeRepo.findActiveByExamAndStudent.mockResolvedValue({ id: 'existing' });

    await expect(
      service.requestExamRegrade({
        examId: 'exam-1',
        professorId: 't-1',
        currentUserId: 'user-1',
      } as any),
    ).rejects.toThrow('YA EXISTE UNA SOLICITUD ACTIVA');

    examRegradeRepo.findActiveByExamAndStudent.mockResolvedValue(null);
    teacherRepo.get_by_id.mockResolvedValue({ id: 't-1' });
    teacherSubjectLinkRepo.getAssignments.mockResolvedValue({
      teachingSubjectIds: [],
      leadSubjectIds: [],
    });

    await expect(
      service.requestExamRegrade({
        examId: 'exam-1',
        professorId: 't-1',
        currentUserId: 'user-1',
      } as any),
    ).rejects.toThrow('PROFESOR NO ASIGNADO A LA MATERIA');
  });

  it('sendExamToEvaluator: lanza NotFound cuando no hay asignación', async () => {
    const { service, studentRepo, examAssignmentRepo } = makeService();
    studentRepo.list.mockResolvedValue([{ id: 'stu-1' }]);
    examAssignmentRepo.findByExamIdAndStudentId.mockResolvedValue(null);

    await expect(
      service.sendExamToEvaluator({ examId: 'exam-1', currentUserId: 'user-1' } as any),
    ).rejects.toThrow('ASIGNACIÓN NO ENCONTRADA');
  });

  it('calculateExamGrade: valida que el profesor asignado coincida', async () => {
    const {
      service,
      teacherRepo,
      examAssignmentRepo,
      examQuestionRepo,
      examResponseRepo,
    } = makeService();

    teacherRepo.list.mockResolvedValue([{ id: 't-1' }]);
    examAssignmentRepo.findDetailedById.mockResolvedValue({
      id: 'assign-1',
      examId: 'exam-1',
      studentId: 'stu-1',
      teacherId: 'other',
      status: AssignedExamStatus.IN_EVALUATION,
    });
    examQuestionRepo.listByExamId.mockResolvedValue([{ id: 'eq-1', questionScore: 1 }]);
    examResponseRepo.listByExamAndStudent.mockResolvedValue([
      { examQuestionId: 'eq-1', autoPoints: 1, manualPoints: null },
    ]);

    await expect(
      service.calculateExamGrade({ assignmentId: 'assign-1', currentUserId: 'user-1' } as any),
    ).rejects.toThrow('NO ERES EL DOCENTE ASIGNADO');
  });

  it('createExamAssignment: valida que el profesor esté asignado a la materia', async () => {
    const {
      service,
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
      teachingSubjectIds: [],
      leadSubjectIds: [],
      leadSubjectNames: [],
      teachingSubjectNames: [],
    });
    studentRepo.list.mockResolvedValue([{ id: 'stu-1' }]);

    await expect(
      service.createExamAssignment('exam-1', ['stu-1'], 'user-1', new Date(), 60),
    ).rejects.toThrow('PROFESOR NO ASIGNADO A LA MATERIA');
  });

  it('calculateStatusForSnapshot: retorna ENABLED cuando aún está en ventana de aplicación', async () => {
    const { service } = makeService();
    const now = new Date('2024-01-01T12:00:00Z');

    const duringExam = await (service as any).calculateStatusForSnapshot(
      {
        status: AssignedExamStatus.ENABLED,
        applicationDate: new Date('2024-01-01T11:55:00Z'),
        durationMinutes: 10,
        grade: null,
      },
      now,
    );

    expect(duringExam).toBe(AssignedExamStatus.ENABLED);
  });

  it('listEvaluatorExams: lanza error cuando el docente no existe', async () => {
    const { service, teacherRepo } = makeService();
    teacherRepo.list.mockResolvedValue([]);

    await expect(
      service.listEvaluatorExams({ currentUserId: 'u', page: 1, limit: 5 } as any),
    ).rejects.toThrow('PROFESOR NO ENCONTRADO');
  });

  it('calculateStatusForSnapshot: devuelve el estado actual cuando no hay fecha de aplicación', async () => {
    const { service } = makeService();
    const status = await (service as any).calculateStatusForSnapshot(
      {
        status: AssignedExamStatus.CANCELLED,
        applicationDate: null,
        durationMinutes: null,
        grade: null,
      },
      new Date(),
    );
    expect(status).toBe(AssignedExamStatus.CANCELLED);
  });
});
