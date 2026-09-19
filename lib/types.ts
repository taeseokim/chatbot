export type BmiCategory = '저체중' | '정상체중' | '과체중' | '비만';

export interface TestCase {
  id: number;
  title: string;
  description: string;
  height: number; // cm
  weight: number; // kg
  expectedBmi: number;
  expectedCategory: BmiCategory;
  score: number;
  isHidden?: boolean;
}

export interface TestCaseResult {
  testCaseId: number;
  title: string;
  passed: boolean;
  input: {
    height: number;
    weight: number;
  };
  expectedCategory: BmiCategory;
  detectedCategory?: string;
  detectedBmi?: number;
  expectedBmi: number;
  actualOutput: string;
  error?: string;
  executionTimeMs: number;
  score: number;
  maxScore: number;
}

export interface Submission {
  id: string;
  studentId: string;     // 학번 (예: 20101)
  studentName: string;   // 이름 (예: 홍길동)
  code: string;
  score: number;         // 획득 점수 (0~100)
  totalScore: number;    // 만점 (100)
  passedCount: number;
  totalCount: number;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  results: TestCaseResult[];
  createdAt: string;     // ISO timestamp
}

export interface RunSingleResult {
  success: boolean;
  output: string;
  error?: string;
  executionTimeMs: number;
}

