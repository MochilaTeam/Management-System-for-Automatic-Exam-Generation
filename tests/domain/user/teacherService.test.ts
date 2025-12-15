import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';

import { TeacherService } from '../../../app/domains/user/domain/services/teacherService';

const makeTeacherRepo = () =>
  ({
    existsBy: vi.fn(),
    createProfile: vi.fn(),
    get_by_id: vi.fn(),
    paginate: vi.fn(),
    updateProfile: vi.fn(),
    deleteById: vi.fn(),
    findByIds: vi.fn(),
  } as any);

const makeUserRepo = () =>
  ({
    get_by_id: vi.fn(),
  } as any);

const makeSubjectLinkRepo = () =>
  ({
    findMissingSubjectIds: vi.fn(),
    findSubjectLeaders: vi.fn(),
    findTeachersForSubject: vi.fn(),
    syncTeachingSubjects: vi.fn(),
    syncLeadSubjects: vi.fn(),
    getAssignments: vi.fn(),
    getAssignmentsForTeachers: vi.fn(),
  } as any);

beforeAll(() => {
  vi.spyOn(TeacherService.prototype as any, 'raiseBusinessRuleError').mockImplementation(
    (...args: any[]) => {
      const message = args[1] ?? 'BUSINESS_RULE_ERROR';
      throw new Error(message);
    },
  );
  vi.spyOn(TeacherService.prototype as any, 'raiseNotFoundError').mockImplementation(
    (...args: any[]) => {
      const message = args[1] ?? 'NOT_FOUND';
      throw new Error(message);
    },
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('TeacherService', () => {
  it('createProfile: valida usuario, evita duplicados y sincroniza asignaturas', async () => {
    const teacherRepo = makeTeacherRepo();
    const userRepo = makeUserRepo();
    const subjectLinkRepo = makeSubjectLinkRepo();
    const service = new TeacherService({ teacherRepo, userRepo, subjectLinkRepo });

    userRepo.get_by_id.mockResolvedValue({ id: 'u1' });
    teacherRepo.existsBy.mockResolvedValue(false);
    subjectLinkRepo.findMissingSubjectIds.mockResolvedValue([]);
    subjectLinkRepo.findSubjectLeaders.mockResolvedValue(new Map());
    const teacher = {
      id: 't1',
      userId: 'u1',
      specialty: 'Math',
      hasRoleSubjectLeader: true,
      hasRoleExaminer: false,
    } as any;
    teacherRepo.createProfile.mockResolvedValue(teacher);
    subjectLinkRepo.getAssignments.mockResolvedValue({
      leadSubjectIds: ['s1'],
      leadSubjectNames: ['Álgebra'],
      teachingSubjectIds: ['s2'],
      teachingSubjectNames: ['Geometría'],
    });

    const input: any = {
      userId: 'u1',
      specialty: 'Math',
      hasRoleSubjectLeader: true,
      hasRoleExaminer: false,
      subjects_ids: ['s1'],
      teaching_subjects_ids: ['s2'],
    };

    const result = await service.createProfile(input);

    expect(userRepo.get_by_id).toHaveBeenCalledWith('u1');
    expect(teacherRepo.existsBy).toHaveBeenCalledWith({ userId: 'u1' });
    expect(subjectLinkRepo.findMissingSubjectIds).toHaveBeenCalledWith(['s1', 's2']);
    expect(subjectLinkRepo.findSubjectLeaders).toHaveBeenCalledWith(['s1']);
    expect(teacherRepo.createProfile).toHaveBeenCalled();
    expect(subjectLinkRepo.syncTeachingSubjects).toHaveBeenCalledWith('t1', ['s2']);
    expect(subjectLinkRepo.syncLeadSubjects).toHaveBeenCalledWith('t1', ['s1']);
    expect(result.subjects_ids).toEqual(['s1']);
    expect(result.teaching_subjects_ids).toEqual(['s2']);
    expect(result.subjects_names).toEqual(['Álgebra']);
    expect(result.teaching_subjects_names).toEqual(['Geometría']);
  });

  it('createProfile: lanza error si el usuario no existe', async () => {
    const teacherRepo = makeTeacherRepo();
    const userRepo = makeUserRepo();
    const subjectLinkRepo = makeSubjectLinkRepo();
    const service = new TeacherService({ teacherRepo, userRepo, subjectLinkRepo });

    userRepo.get_by_id.mockResolvedValue(null);

    await expect(
      service.createProfile({
        userId: 'missing',
        specialty: 'Math',
        hasRoleSubjectLeader: false,
        hasRoleExaminer: false,
      }),
    ).rejects.toThrow('User not found');
  });

  it('updateProfile: actualiza campos y sincroniza asignaciones', async () => {
    const teacherRepo = makeTeacherRepo();
    const userRepo = makeUserRepo();
    const subjectLinkRepo = makeSubjectLinkRepo();
    const service = new TeacherService({ teacherRepo, userRepo, subjectLinkRepo });

    const updated = {
      id: 't1',
      specialty: 'Sci',
      hasRoleSubjectLeader: true,
      hasRoleExaminer: true,
    } as any;
    teacherRepo.updateProfile.mockResolvedValue(updated);
    subjectLinkRepo.findMissingSubjectIds.mockResolvedValue([]);
    subjectLinkRepo.findSubjectLeaders.mockResolvedValue(new Map());
    subjectLinkRepo.getAssignments.mockResolvedValue({
      leadSubjectIds: ['s3'],
      leadSubjectNames: ['Química'],
      teachingSubjectIds: ['s4'],
      teachingSubjectNames: ['Física'],
    });

    const result = await service.updateProfile('t1', {
      specialty: 'Sci',
      hasRoleExaminer: true,
      hasRoleSubjectLeader: true,
      subjects_ids: ['s3'],
      teaching_subjects_ids: ['s4'],
    });

    expect(teacherRepo.updateProfile).toHaveBeenCalledWith('t1', {
      specialty: 'Sci',
      hasRoleExaminer: true,
      hasRoleSubjectLeader: true,
    });
    expect(subjectLinkRepo.findMissingSubjectIds).toHaveBeenCalledWith(['s4']);
    expect(subjectLinkRepo.findSubjectLeaders).toHaveBeenCalledWith(['s3']);
    expect(subjectLinkRepo.syncTeachingSubjects).toHaveBeenCalledWith('t1', ['s4']);
    expect(subjectLinkRepo.syncLeadSubjects).toHaveBeenCalledWith('t1', ['s3']);
    expect(result.subjects_names).toEqual(['Química']);
    expect(result.teaching_subjects_names).toEqual(['Física']);
  });

  it('paginate: aplica defaults y mezcla asignaciones de materias', async () => {
    const teacherRepo = makeTeacherRepo();
    const userRepo = makeUserRepo();
    const subjectLinkRepo = makeSubjectLinkRepo();
    const service = new TeacherService({ teacherRepo, userRepo, subjectLinkRepo });

    const teacher = { id: 't1', userId: 'u1', hasRoleExaminer: true } as any;
    teacherRepo.paginate.mockResolvedValue({ items: [teacher], total: 1 });
    const assignments = new Map();
    assignments.set('t1', {
      leadSubjectIds: [],
      leadSubjectNames: [],
      teachingSubjectIds: ['s1'],
      teachingSubjectNames: ['Álgebra'],
    });
    subjectLinkRepo.getAssignmentsForTeachers.mockResolvedValue(assignments);

    const result = await service.paginate({} as any);

    expect(teacherRepo.paginate).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
      filters: {
        userId: undefined,
        role: undefined,
        active: true,
        filter: undefined,
        email: undefined,
        subjectLeader: undefined,
        examiner: undefined,
      },
    });
    expect(result.list[0].teaching_subjects_ids).toEqual(['s1']);
    expect(result.total).toBe(1);
  });

  it('deleteById: limpia asignaciones y elimina profesor', async () => {
    const teacherRepo = makeTeacherRepo();
    const userRepo = makeUserRepo();
    const subjectLinkRepo = makeSubjectLinkRepo();
    const service = new TeacherService({ teacherRepo, userRepo, subjectLinkRepo });

    teacherRepo.deleteById.mockResolvedValue(true);

    const deleted = await service.deleteById('t1');

    expect(subjectLinkRepo.syncTeachingSubjects).toHaveBeenCalledWith('t1', []);
    expect(subjectLinkRepo.syncLeadSubjects).toHaveBeenCalledWith('t1', []);
    expect(teacherRepo.deleteById).toHaveBeenCalledWith('t1');
    expect(deleted).toBe(true);
  });

  it('createProfile: lanza error si faltan asignaturas', async () => {
    const teacherRepo = makeTeacherRepo();
    const userRepo = makeUserRepo();
    const subjectLinkRepo = makeSubjectLinkRepo();
    const service = new TeacherService({ teacherRepo, userRepo, subjectLinkRepo });

    userRepo.get_by_id.mockResolvedValue({ id: 'u1' });
    teacherRepo.existsBy.mockResolvedValue(false);
    subjectLinkRepo.findMissingSubjectIds.mockResolvedValue(['s1']);

    await expect(
      service.createProfile({
        userId: 'u1',
        specialty: 'Math',
        hasRoleSubjectLeader: false,
        hasRoleExaminer: false,
        subjects_ids: ['s1'],
      }),
    ).rejects.toThrow('Subject not found');
  });

  it('updateProfile: evita asignar materias con líder existente', async () => {
    const teacherRepo = makeTeacherRepo();
    const userRepo = makeUserRepo();
    const subjectLinkRepo = makeSubjectLinkRepo();
    const service = new TeacherService({ teacherRepo, userRepo, subjectLinkRepo });

    teacherRepo.get_by_id.mockResolvedValue({ id: 't1' });
    subjectLinkRepo.findMissingSubjectIds.mockResolvedValue([]);
    subjectLinkRepo.findSubjectLeaders.mockResolvedValue(new Map([['s1', 'other']]));

    await expect(
      service.updateProfile('t1', { subjects_ids: ['s1'] }),
    ).rejects.toThrow('La asignatura ya tiene un jefe');
  });

  it('getById: retorna perfil con asignaciones', async () => {
    const teacherRepo = makeTeacherRepo();
    const userRepo = makeUserRepo();
    const subjectLinkRepo = makeSubjectLinkRepo();
    const service = new TeacherService({ teacherRepo, userRepo, subjectLinkRepo });

    teacherRepo.get_by_id.mockResolvedValue({ id: 't1', name: 'Docente' });
    subjectLinkRepo.getAssignments.mockResolvedValue({
      leadSubjectIds: ['s1'],
      leadSubjectNames: ['Algebra'],
      teachingSubjectIds: ['s2'],
      teachingSubjectNames: ['Geo'],
    });

    const result = await service.getById('t1');

    expect(result?.subjects_ids).toEqual(['s1']);
    expect(result?.teaching_subjects_names).toEqual(['Geo']);
  });

  it('findTeachersBySubject: retorna profesores ordenados con asignaciones', async () => {
    const teacherRepo = makeTeacherRepo();
    const userRepo = makeUserRepo();
    const subjectLinkRepo = makeSubjectLinkRepo();
    const service = new TeacherService({ teacherRepo, userRepo, subjectLinkRepo });

    subjectLinkRepo.findTeachersForSubject.mockResolvedValue(['t2', 't1']);
    teacherRepo.findByIds.mockResolvedValue([
      { id: 't2', name: 'Zelda' },
      { id: 't1', name: 'Anna' },
    ]);
    const assignments = new Map();
    assignments.set('t1', {
      leadSubjectIds: [],
      leadSubjectNames: [],
      teachingSubjectIds: ['s1'],
      teachingSubjectNames: ['Álgebra'],
    });
    assignments.set('t2', {
      leadSubjectIds: ['s1'],
      leadSubjectNames: ['Álgebra'],
      teachingSubjectIds: [],
      teachingSubjectNames: [],
    });
    subjectLinkRepo.getAssignmentsForTeachers.mockResolvedValue(assignments);

    const result = await service.findTeachersBySubject('s1');

    expect(result[0].id).toBe('t1');
    expect(result[1].subjects_ids).toEqual(['s1']);
  });
});
