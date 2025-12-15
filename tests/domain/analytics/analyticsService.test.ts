import { describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from '../../../app/domains/analytics/domain/services/analyticsService';
import { IAnalyticsRepository } from '../../../app/domains/analytics/domain/ports/IAnalyticsRepository';
import { DifficultyLevelEnum } from '../../../app/domains/question-bank/entities/enums/DifficultyLevels';
import { ExamComparisonSortByEnum } from '../../../app/domains/analytics/entities/enums/ExamComparisonSortByEnum';
import { SubjectDifficultySortByEnum } from '../../../app/domains/analytics/entities/enums/SubjectDifficultySortByEnum';

const makeService = (repo: Partial<IAnalyticsRepository>) =>
    new AnalyticsService({ analyticsRepo: repo as IAnalyticsRepository });

describe('AnalyticsService', () => {
    it('getSubjectDifficultyReport limita resultados y expone correlación', async () => {
        const repo: Partial<IAnalyticsRepository> = {
            fetchSubjectDifficultyRecords: vi.fn().mockResolvedValue([
                {
                    subjectId: 's1',
                    subjectName: 'Matemáticas',
                    difficulty: DifficultyLevelEnum.EASY,
                    averageGrade: 8,
                    examCount: 2,
                },
                {
                    subjectId: 's1',
                    subjectName: 'Matemáticas',
                    difficulty: DifficultyLevelEnum.HARD,
                    averageGrade: 4,
                    examCount: 1,
                },
                {
                    subjectId: 's2',
                    subjectName: 'Física',
                    difficulty: DifficultyLevelEnum.EASY,
                    averageGrade: 7,
                    examCount: 1,
                },
            ]),
            fetchTopFailingQuestions: vi.fn().mockResolvedValue([
                {
                    questionId: 'q1',
                    topicId: null,
                    topicName: null,
                    subjectId: 's1',
                    subjectName: 'Matemáticas',
                    authorId: 't1',
                    authorName: 'Profesor A',
                    failureRate: 0.8,
                },
            ]),
            fetchRegradeComparison: vi.fn().mockResolvedValue([
                {
                    subjectId: 's1',
                    subjectName: 'Matemáticas',
                    course: '3A',
                    regradeAverage: 7,
                    courseAverage: 6.5,
                    requests: 1,
                },
            ]),
        };

        const service = makeService(repo);
        const result = await service.getSubjectDifficultyReport({
            subjectIds: undefined,
            limit: 1,
            offset: 0,
            sortBy: SubjectDifficultySortByEnum.SUBJECT_NAME,
            sortOrder: 'asc',
        });

        expect(result.subjectCorrelations).toHaveLength(1);
        expect(result.subjectCorrelations[0].subjectId).toBe('s1');
        expect(result.topFailingQuestions[0].questionId).toBe('q1');
        expect(result.regradeComparison[0].course).toBe('3A');
    });

    it('compareExamsAcrossSubjects marca balance cuando la desviación es alta', async () => {
        const repo: Partial<IAnalyticsRepository> = {
            fetchExamComparisonBase: vi.fn().mockResolvedValue({
                exams: [
                    { examId: 'e1', title: 'Auto', subjectId: 's1', subjectName: 'Historia' },
                ],
                total: 1,
            }),
            fetchExamDifficultyRecords: vi.fn().mockResolvedValue([
                { examId: 'e1', difficulty: DifficultyLevelEnum.EASY, count: 4 },
                { examId: 'e1', difficulty: DifficultyLevelEnum.HARD, count: 1 },
            ]),
            fetchExamTopicRecords: vi.fn().mockResolvedValue([
                { examId: 'e1', topicId: 't1', topicName: 'Tema 1', count: 5 },
            ]),
        };

        const service = makeService(repo);
        const result = await service.compareExamsAcrossSubjects({
            subjectIds: undefined,
            limit: 1,
            offset: 0,
            sortBy: ExamComparisonSortByEnum.CREATED_AT,
            sortOrder: 'asc',
            balanceThreshold: 0.1,
        });

        expect(result.data[0].balanced).toBe(false);
        expect(result.data[0].topicDistribution).toHaveLength(1);
        expect(result.data[0].difficultyDistribution.HARD).toBeCloseTo(0.2, 5);
    });

    it('getExamPerformance calcula la tasa global y agrupa por dificultad', async () => {
        const repo: Partial<IAnalyticsRepository> = {
            fetchExamPerformance: vi.fn().mockResolvedValue([
                {
                    examQuestionId: 'eq1',
                    questionId: 'q1',
                    questionIndex: 1,
                    questionScore: 5,
                    difficulty: DifficultyLevelEnum.EASY,
                    topicId: null,
                    topicName: null,
                    averageScore: 4,
                    successRate: 0.8,
                    attempts: 5,
                    questionBody: null,
                },
                {
                    examQuestionId: 'eq2',
                    questionId: 'q2',
                    questionIndex: 2,
                    questionScore: 5,
                    difficulty: DifficultyLevelEnum.HARD,
                    topicId: null,
                    topicName: null,
                    averageScore: 2,
                    successRate: 0.4,
                    attempts: 4,
                    questionBody: null,
                },
            ]),
        };

        const service = makeService(repo);
        const result = await service.getExamPerformance('exam-1');

    expect(result.questions).toHaveLength(2);
    expect(result.overallSuccessRate).toBeCloseTo((4 * 5 + 2 * 4) / (5 * 5 + 5 * 4), 6);
    expect(result.difficultyGroups.find((group) => group.difficulty === DifficultyLevelEnum.EASY)?.examCount).toBe(1);
  });

  it('listAutomaticExams resume parámetros automáticos de manera legible', async () => {
    const repo: Partial<IAnalyticsRepository> = {
      fetchAutomaticExams: vi.fn().mockResolvedValue({
        items: [
          {
            examId: 'e1',
            title: 'Auto',
            subjectId: 's1',
            parameters: {
              questionCount: 4,
              questionTypePercentages: { sel: 2, multi: 2 },
              topicCoverage: { algebra: 0.5, geometry: 0.5 },
            },
          },
          { examId: 'e2', title: 'Sin params', subjectId: 's1', parameters: {} },
        ],
        total: 2,
      }),
    };

    const service = makeService(repo);
    const result = await service.listAutomaticExams({
      limit: 10,
      offset: 0,
    } as any);

    expect(result.data[0].parameterSummary).toContain('Proporción de preguntas por tipo');
    expect(result.data[0].parameterSummary).toContain('sel: 50%');
    expect(result.data[0].parameterSummary).toContain('algebra: 50%');
    expect(result.data[1].parameterSummary).toContain('Sin detalles');
  });

  it('compareExamsAcrossSubjects retorna paginado vacío cuando no hay exámenes', async () => {
    const repo: Partial<IAnalyticsRepository> = {
      fetchExamComparisonBase: vi.fn().mockResolvedValue({ exams: [], total: 0 }),
    };

    const service = makeService(repo);
    const result = await service.compareExamsAcrossSubjects({
      subjectIds: [],
      limit: 5,
      offset: 0,
      sortBy: ExamComparisonSortByEnum.CREATED_AT,
      sortOrder: 'desc',
      balanceThreshold: 0.2,
    });

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it('listValidatedExams y listPopularQuestions delegan correctamente al repositorio', async () => {
    const repo: Partial<IAnalyticsRepository> = {
      fetchValidatedExams: vi.fn().mockResolvedValue({ items: [{ examId: 'e1' }], total: 1 }),
      fetchPopularQuestions: vi.fn().mockResolvedValue({
        items: [{ questionId: 'q1' }],
        total: 1,
      }),
    };
    const service = makeService(repo);

    const validated = await service.listValidatedExams({ limit: 1, offset: 0 } as any);
    const popular = await service.listPopularQuestions({ limit: 1, offset: 0 } as any);

    expect(validated.data[0].examId).toBe('e1');
    expect(popular.data[0].questionId).toBe('q1');
    expect(repo.fetchValidatedExams).toHaveBeenCalled();
    expect(repo.fetchPopularQuestions).toHaveBeenCalled();
  });
});
