import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../../app/infrastructure/exam-application/models/ExamResponse', () => ({
  __esModule: true,
  default: {
    create: vi.fn(),
    findByPk: vi.fn(),
    findOne: vi.fn(),
    count: vi.fn(),
    findAll: vi.fn(),
  },
}));

import { ExamResponseRepository } from '../../../../app/infrastructure/exam-application/repositories/ExamResponseRepository';
import ExamResponses from '../../../../app/infrastructure/exam-application/models/ExamResponse';
import { ExamResponseMapper } from '../../../../app/infrastructure/exam-application/mappers/examResponseMapper';

const ExamResponsesMock = ExamResponses as any;

describe('ExamResponseRepository', () => {
  let repo: ExamResponseRepository;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    repo = new ExamResponseRepository();
  });

  it('create: usa mapper y devuelve salida mapeada', async () => {
    const attrs = { mapped: true };
    const output = { id: 'resp-1' } as any;
    vi.spyOn(ExamResponseMapper, 'toCreateAttrs').mockReturnValue(attrs as any);
    vi.spyOn(ExamResponseMapper, 'toOutput').mockReturnValue(output);
    (ExamResponsesMock.create as any).mockResolvedValue('row');

    const result = await repo.create({ examId: 'e1' } as any);

    expect(ExamResponseMapper.toCreateAttrs).toHaveBeenCalledWith({ examId: 'e1' });
    expect(ExamResponsesMock.create).toHaveBeenCalledWith(attrs);
    expect(result).toBe(output);
  });

  it('findById: retorna null si no existe', async () => {
    (ExamResponsesMock.findByPk as any).mockResolvedValue(null);

    const res = await repo.findById('resp-1');

    expect(res).toBeNull();
    expect(ExamResponsesMock.findByPk).toHaveBeenCalledWith('resp-1');
  });

  it('findById: mapea la respuesta encontrada', async () => {
    (ExamResponsesMock.findByPk as any).mockResolvedValue('row');
    vi.spyOn(ExamResponseMapper, 'toOutput').mockReturnValue({ id: 'resp-1' } as any);

    const res = await repo.findById('resp-1');

    expect(ExamResponseMapper.toOutput).toHaveBeenCalledWith('row');
    expect(res).toEqual({ id: 'resp-1' });
  });

  it('findByExamQuestionAndStudent: busca por examQuestionId y studentId', async () => {
    (ExamResponsesMock.findOne as any).mockResolvedValue('row');
    vi.spyOn(ExamResponseMapper, 'toOutput').mockReturnValue({ id: 'resp-2' } as any);

    const res = await repo.findByExamQuestionAndStudent('eq-1', 'stu-1');

    expect(ExamResponsesMock.findOne).toHaveBeenCalledWith({
      where: { examQuestionId: 'eq-1', studentId: 'stu-1' },
    });
    expect(res).toEqual({ id: 'resp-2' });
  });

  it('update: actualiza campos y devuelve mapper', async () => {
    const updateFn = vi.fn();
    (ExamResponsesMock.findByPk as any).mockResolvedValue({ update: updateFn });
    vi.spyOn(ExamResponseMapper, 'toOutput').mockReturnValue({ id: 'resp-3' } as any);

    const res = await repo.update({
      responseId: 'resp-3',
      selectedOptions: null,
      textAnswer: 'abc',
      autoPoints: 2,
      answeredAt: new Date('2024-01-01'),
    });

    expect(updateFn).toHaveBeenCalledWith({
      selectedOptions: null,
      textAnswer: 'abc',
      autoPoints: 2,
      answeredAt: new Date('2024-01-01'),
    });
    expect(res).toEqual({ id: 'resp-3' });
  });

  it('studentHasResponses: devuelve true si count > 0', async () => {
    (ExamResponsesMock.count as any).mockResolvedValue(2);

    const res = await repo.studentHasResponses('exam-1', 'stu-1');

    expect(ExamResponsesMock.count).toHaveBeenCalledWith({
      where: { examId: 'exam-1', studentId: 'stu-1' },
    });
    expect(res).toBe(true);
  });

  it('listByExamAndStudent: mapea todos los resultados', async () => {
    (ExamResponsesMock.findAll as any).mockResolvedValue(['r1', 'r2']);
    vi.spyOn(ExamResponseMapper, 'toOutput')
      .mockReturnValueOnce({ id: '1' } as any)
      .mockReturnValueOnce({ id: '2' } as any);

    const res = await repo.listByExamAndStudent('exam-1', 'stu-1');

    expect(ExamResponsesMock.findAll).toHaveBeenCalledWith({
      where: { examId: 'exam-1', studentId: 'stu-1' },
    });
    expect(res).toEqual([{ id: '1' }, { id: '2' }]);
  });
});
