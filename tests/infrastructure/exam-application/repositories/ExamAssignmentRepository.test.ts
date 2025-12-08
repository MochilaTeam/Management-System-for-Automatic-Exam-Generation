import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ModelStatic, Transaction } from 'sequelize';

import { ExamAssignmentRepository } from '../../../../app/infrastructure/exam-application/repositories/ExamAssignmentRepository';
import type ExamAssignments from '../../../../app/infrastructure/exam-application/models/ExamAssignment';
import { ExamAssignmentMapper } from '../../../../app/infrastructure/exam-application/mappers/examAssignmentMapper';
import { AssignedExamStatus } from '../../../../app/domains/exam-application/entities/enums/AssignedExamStatus';

type ExamAssignmentModelStatic = ModelStatic<ExamAssignments>;

describe('ExamAssignmentRepository', () => {
  let mockModel: ExamAssignmentModelStatic;
  let repo: ExamAssignmentRepository;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    mockModel = {
      name: 'ExamAssignment',
      create: vi.fn(),
      findAndCountAll: vi.fn(),
      findOne: vi.fn(),
      findByPk: vi.fn(),
      findAll: vi.fn(),
    } as unknown as ExamAssignmentModelStatic;

    repo = new ExamAssignmentRepository(mockModel);
  });

  it('withTx: crea una instancia que conserva la transacción por defecto', () => {
    const tx = {} as Transaction;
    const repoWithTx = ExamAssignmentRepository.withTx(mockModel, tx);
    expect(repoWithTx).toBeInstanceOf(ExamAssignmentRepository);
  });

  it('createExamAssignment: usa mapper y llama a model.create', async () => {
    const attrs = { examId: 'exam-1' };
    vi.spyOn(ExamAssignmentMapper, 'toCreateAttrs').mockReturnValue(attrs as any);
    (mockModel.create as any).mockResolvedValue({});

    await repo.createExamAssignment({ examId: 'exam-1' } as any);

    expect(ExamAssignmentMapper.toCreateAttrs).toHaveBeenCalledWith({ examId: 'exam-1' });
    expect(mockModel.create).toHaveBeenCalledWith(attrs, { transaction: undefined });
  });

  it('listStudentExamAssignments: arma filtros, incluye relaciones y mapea filas', async () => {
    const includeSpy = vi
      .spyOn(repo as any, 'buildDetailIncludes')
      .mockResolvedValue([{ include: true }] as any);
    (mockModel.findAndCountAll as any).mockResolvedValue({
      rows: ['row-1'],
      count: 1,
    });
    vi.spyOn(ExamAssignmentMapper, 'toStudentExamItem').mockReturnValue({ id: 'mapped-1' } as any);

    const res = await repo.listStudentExamAssignments({
      limit: 5,
      offset: 10,
      filters: { studentId: 'stu-1', subjectId: 'sub-1', status: AssignedExamStatus.ENABLED },
    } as any);

    expect(includeSpy).toHaveBeenCalledWith({ subjectId: 'sub-1' });
    expect(mockModel.findAndCountAll).toHaveBeenCalledWith({
      where: { studentId: 'stu-1', status: AssignedExamStatus.ENABLED },
      include: [{ include: true }],
      limit: 5,
      offset: 10,
      order: [['applicationDate', 'DESC']],
      transaction: undefined,
    });
    expect(res).toEqual({ items: [{ id: 'mapped-1' }], total: 1 });
  });

  it('findByExamIdAndStudentId: busca y mapea la asignación', async () => {
    (mockModel.findOne as any).mockResolvedValue('row');
    vi.spyOn(ExamAssignmentMapper, 'toStudentExamItem').mockReturnValue({ id: 'assign-1' } as any);

    const res = await repo.findByExamIdAndStudentId('exam-1', 'stu-1');

    expect(mockModel.findOne).toHaveBeenCalledWith({
      where: { examId: 'exam-1', studentId: 'stu-1' },
      transaction: undefined,
    });
    expect(res).toEqual({ id: 'assign-1' });
  });

  it('updateStatus: obtiene la fila y ejecuta update con el estado nuevo', async () => {
    const updateFn = vi.fn();
    (mockModel.findByPk as any).mockResolvedValue({ update: updateFn });

    await repo.updateStatus('assign-1', AssignedExamStatus.IN_EVALUATION);

    expect(mockModel.findByPk).toHaveBeenCalledWith('assign-1', { transaction: undefined });
    expect(updateFn).toHaveBeenCalledWith({ status: AssignedExamStatus.IN_EVALUATION }, { transaction: undefined });
  });

  it('updateGrade: actualiza la calificación y estado opcional', async () => {
    const updateFn = vi.fn();
    (mockModel.findByPk as any).mockResolvedValue({ update: updateFn });

    await repo.updateGrade('assign-2', { grade: 4.5, status: AssignedExamStatus.GRADED });

    expect(updateFn).toHaveBeenCalledWith(
      { grade: 4.5, status: AssignedExamStatus.GRADED },
      { transaction: undefined },
    );
  });

  it('listAssignmentsForStatusRefresh: transforma filas a snapshots', async () => {
    (mockModel.findAll as any).mockResolvedValue([
      {
        id: 'a1',
        examId: 'e1',
        studentId: 's1',
        status: AssignedExamStatus.PENDING,
        applicationDate: new Date('2024-01-01'),
        durationMinutes: 60,
        grade: null,
      },
    ]);

    const res = await repo.listAssignmentsForStatusRefresh('s1');

    expect(mockModel.findAll).toHaveBeenCalledWith({
      where: { studentId: 's1' },
      transaction: undefined,
    });
    expect(res[0]).toMatchObject({
      id: 'a1',
      examId: 'e1',
      studentId: 's1',
      status: AssignedExamStatus.PENDING,
      durationMinutes: 60,
      grade: null,
    });
  });
});
