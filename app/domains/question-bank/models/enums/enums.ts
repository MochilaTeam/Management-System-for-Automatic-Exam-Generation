// Enums TypeScript
export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  ESSAY = 'ESSAY',
}

export const DifficultyValues = Object.values(Difficulty);
export const QuestionTypeValues = Object.values(QuestionType);
