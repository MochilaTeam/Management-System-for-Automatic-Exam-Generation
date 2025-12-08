import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Op } from 'sequelize';

vi.mock('../../../../app/infrastructure/question-bank/models/Subject', () => ({
  __esModule: true,
  default: {
    findAll: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../../../app/infrastructure/question-bank/models/TeacherSubject', () => ({
  __esModule: true,
  default: {
    findAll: vi.fn(),
    destroy: vi.fn(),
    bulkCreate: vi.fn(),
  },
}));

import { TeacherSubjectLinkRepository } from '../../../../app/infrastructure/question-bank/repositories/teacherSubjectLinkRepository';
import Subject from '../../../../app/infrastructure/question-bank/models/Subject';
import TeacherSubject from '../../../../app/infrastructure/question-bank/models/TeacherSubject';

const SubjectMock = Subject as any;
const TeacherSubjectMock = TeacherSubject as any;

describe('TeacherSubjectLinkRepository', () => {
  let repo: TeacherSubjectLinkRepository;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    repo = new TeacherSubjectLinkRepository();
  });

  it('findMissingSubjectIds: retorna ids faltantes tras eliminar duplicados', async () => {
    SubjectMock.findAll.mockResolvedValue([{ getDataValue: () => 's1' }]);

    const missing = await repo.findMissingSubjectIds(['s1', 's2', 's2']);

    expect(SubjectMock.findAll).toHaveBeenCalledWith({
      where: { id: { [Op.in]: ['s1', 's2'] } },
      attributes: ['id'],
      transaction: undefined,
    });
    expect(missing).toEqual(['s2']);
  });

  it('syncTeachingSubjects: elimina asignaciones que sobran y crea nuevas', async () => {
    TeacherSubjectMock.findAll.mockResolvedValue([
      { get: () => ({ teacherId: 't1', subjectId: 'old' }) },
    ]);

    await repo.syncTeachingSubjects('t1', ['new']);

    expect(TeacherSubjectMock.destroy).toHaveBeenCalledWith({
      where: { teacherId: 't1', subjectId: ['old'] },
      transaction: undefined,
    });
    expect(TeacherSubjectMock.bulkCreate).toHaveBeenCalledWith(
      [{ teacherId: 't1', subjectId: 'new' }],
      { ignoreDuplicates: true, transaction: undefined },
    );
  });

  it('syncLeadSubjects: limpia materias antiguas y asigna las nuevas', async () => {
    await repo.syncLeadSubjects('t1', ['s1', 's2']);

    expect(SubjectMock.update).toHaveBeenCalledWith(
      { leadTeacherId: null },
      { where: { leadTeacherId: 't1', id: { [Op.notIn]: ['s1', 's2'] } }, transaction: undefined },
    );
    expect(SubjectMock.update).toHaveBeenCalledWith(
      { leadTeacherId: 't1' },
      { where: { id: { [Op.in]: ['s1', 's2'] } }, transaction: undefined },
    );
  });

  it('getAssignmentsForTeachers: construye mapa con materias lideradas y que dicta', async () => {
    SubjectMock.findAll
      .mockResolvedValueOnce([
        { get: () => ({ id: 'lead-1', name: 'Lead Subject', leadTeacherId: 't1' }) },
      ])
      .mockResolvedValueOnce([{ get: () => ({ id: 'teach-1', name: 'Teach Subject' }) }]);
    TeacherSubjectMock.findAll.mockResolvedValue([
      { get: () => ({ teacherId: 't1', subjectId: 'teach-1' }) },
    ]);

    const map = await repo.getAssignmentsForTeachers(['t1']);
    const assignments = map.get('t1')!;

    expect(assignments.leadSubjectIds).toEqual(['lead-1']);
    expect(assignments.leadSubjectNames).toEqual(['Lead Subject']);
    expect(assignments.teachingSubjectIds).toEqual(['teach-1']);
    expect(assignments.teachingSubjectNames).toEqual(['Teach Subject']);
  });
});
