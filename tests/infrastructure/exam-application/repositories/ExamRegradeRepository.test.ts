import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Op } from 'sequelize';

vi.mock('../../../../app/infrastructure/exam-application/models/ExamRegrade', () => ({
  __esModule: true,
  default: {
    create: vi.fn(),
    findOne: vi.fn(),
  },
}));

import { ExamRegradeRepository } from '../../../../app/infrastructure/exam-application/repositories/ExamRegradeRepository';
import ExamRegrades from '../../../../app/infrastructure/exam-application/models/ExamRegrade';
import { ExamRegradeMapper } from '../../../../app/infrastructure/exam-application/mappers/examRegradeMapper';
import { ExamRegradesStatus } from '../../../../app/domains/exam-application/entities/enums/ExamRegradeStatus';

const ExamRegradesMock = ExamRegrades as any;

describe('ExamRegradeRepository', () => {
  let repo: ExamRegradeRepository;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    repo = new ExamRegradeRepository(ExamRegradesMock);
  });

  it('create: persiste con los campos esperados y mapea la salida', async () => {
    const output = { id: 'regrade-1' } as any;
    vi.spyOn(ExamRegradeMapper, 'toOutput').mockReturnValue(output);
    (ExamRegradesMock.create as any).mockResolvedValue('row');

    const res = await repo.create({
      examId: 'exam-1',
      studentId: 'stu-1',
      professorId: 'prof-1',
      reason: 'text',
      status: ExamRegradesStatus.REQUESTED,
      requestedAt: new Date('2024-01-01'),
    });

    expect(ExamRegradesMock.create).toHaveBeenCalledWith({
      examId: 'exam-1',
      studentId: 'stu-1',
      professorId: 'prof-1',
      reason: 'text',
      status: ExamRegradesStatus.REQUESTED,
      requestedAt: new Date('2024-01-01'),
    });
    expect(res).toBe(output);
  });

  it('findActiveByExamAndStudent: busca por examen y estudiante filtrando estados activos', async () => {
    const mapped = { id: 'regrade-2' } as any;
    (ExamRegradesMock.findOne as any).mockResolvedValue('row');
    vi.spyOn(ExamRegradeMapper, 'toOutput').mockReturnValue(mapped);

    const res = await repo.findActiveByExamAndStudent('exam-1', 'stu-1');

    expect(ExamRegradesMock.findOne).toHaveBeenCalledWith({
      where: {
        examId: 'exam-1',
        studentId: 'stu-1',
        status: { [Op.in]: [ExamRegradesStatus.REQUESTED, ExamRegradesStatus.IN_REVIEW] },
      },
    });
    expect(res).toBe(mapped);
  });

  it('findActiveByExamAndStudent: devuelve null si no hay registros', async () => {
    (ExamRegradesMock.findOne as any).mockResolvedValue(null);

    const res = await repo.findActiveByExamAndStudent('exam-1', 'stu-1');

    expect(res).toBeNull();
  });
});
