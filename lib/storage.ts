import fs from 'fs';
import path from 'path';
import { Submission } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getAllSubmissions(): Submission[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as Submission[];
  } catch (err) {
    console.error('Failed to read submissions:', err);
    return [];
  }
}

export function saveSubmission(submission: Submission): void {
  ensureDataFile();
  const list = getAllSubmissions();
  // 동일 학생이 여러 번 제출할 수 있으므로, 기존 제출 유지 또는 최신순 추가
  list.unshift(submission);
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

export function deleteSubmission(id: string): boolean {
  ensureDataFile();
  const list = getAllSubmissions();
  const filtered = list.filter((s) => s.id !== id);
  if (filtered.length !== list.length) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  }
  return false;
}

export function resetSubmissions(): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

export function seedSampleSubmissions(): Submission[] {
  const samples: Submission[] = [
    {
      id: 'sub_induk_001',
      studentId: '20101',
      studentName: '김민준',
      code: `height = float(input("키(cm): "))\nweight = float(input("몸무게(kg): "))\nh_m = height / 100\nbmi = weight / (h_m * h_m)\n\nprint(f"BMI: {bmi:.2f}")\nif bmi < 18.5:\n    print("저체중")\nelif bmi < 23.0:\n    print("정상체중")\nelif bmi < 25.0:\n    print("과체중")\nelse:\n    print("비만")`,
      score: 100,
      totalScore: 100,
      passedCount: 5,
      totalCount: 5,
      status: 'PASS',
      results: [
        { testCaseId: 1, title: '테스트 1 (저체중 판정)', passed: true, input: { height: 170, weight: 48 }, expectedCategory: '저체중', detectedCategory: '저체중', detectedBmi: 16.61, expectedBmi: 16.61, actualOutput: 'BMI: 16.61\\n저체중', executionTimeMs: 42, score: 20, maxScore: 20 },
        { testCaseId: 2, title: '테스트 2 (정상체중 판정)', passed: true, input: { height: 160, weight: 52 }, expectedCategory: '정상체중', detectedCategory: '정상체중', detectedBmi: 20.31, expectedBmi: 20.31, actualOutput: 'BMI: 20.31\\n정상체중', executionTimeMs: 38, score: 20, maxScore: 20 },
        { testCaseId: 3, title: '테스트 3 (과체중 판정)', passed: true, input: { height: 175, weight: 72 }, expectedCategory: '과체중', detectedCategory: '과체중', detectedBmi: 23.51, expectedBmi: 23.51, actualOutput: 'BMI: 23.51\\n과체중', executionTimeMs: 40, score: 20, maxScore: 20 },
        { testCaseId: 4, title: '테스트 4 (비만 판정)', passed: true, input: { height: 180, weight: 85 }, expectedCategory: '비만', detectedCategory: '비만', detectedBmi: 26.23, expectedBmi: 26.23, actualOutput: 'BMI: 26.23\\n비만', executionTimeMs: 39, score: 20, maxScore: 20 },
        { testCaseId: 5, title: '테스트 5 (경계값 검증: BMI 25.0)', passed: true, input: { height: 150, weight: 56.25 }, expectedCategory: '비만', detectedCategory: '비만', detectedBmi: 25.0, expectedBmi: 25.0, actualOutput: 'BMI: 25.00\n비만', executionTimeMs: 41, score: 20, maxScore: 20 },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 'sub_induk_002',
      studentId: '20102',
      studentName: '이서연',
      code: `h = float(input())\nw = float(input())\nbmi = w / ((h/100)**2)\nif bmi < 18.5:\n    print("저체중")\nelif bmi < 23:\n    print("정상")\nelif bmi < 25:\n    print("과체중")\nelse:\n    print("비만")`,
      score: 100,
      totalScore: 100,
      passedCount: 5,
      totalCount: 5,
      status: 'PASS',
      results: [
        { testCaseId: 1, title: '테스트 1 (저체중 판정)', passed: true, input: { height: 170, weight: 48 }, expectedCategory: '저체중', detectedCategory: '저체중', detectedBmi: 16.61, expectedBmi: 16.61, actualOutput: '저체중', executionTimeMs: 35, score: 20, maxScore: 20 },
        { testCaseId: 2, title: '테스트 2 (정상체중 판정)', passed: true, input: { height: 160, weight: 52 }, expectedCategory: '정상체중', detectedCategory: '정상', detectedBmi: 20.31, expectedBmi: 20.31, actualOutput: '정상', executionTimeMs: 34, score: 20, maxScore: 20 },
        { testCaseId: 3, title: '테스트 3 (과체중 판정)', passed: true, input: { height: 175, weight: 72 }, expectedCategory: '과체중', detectedCategory: '과체중', detectedBmi: 23.51, expectedBmi: 23.51, actualOutput: '과체중', executionTimeMs: 36, score: 20, maxScore: 20 },
        { testCaseId: 4, title: '테스트 4 (비만 판정)', passed: true, input: { height: 180, weight: 85 }, expectedCategory: '비만', detectedCategory: '비만', detectedBmi: 26.23, expectedBmi: 26.23, actualOutput: '비만', executionTimeMs: 35, score: 20, maxScore: 20 },
        { testCaseId: 5, title: '테스트 5 (경계값 검증: BMI 25.0)', passed: true, input: { height: 170, weight: 72.25 }, expectedCategory: '비만', detectedCategory: '비만', detectedBmi: 25.0, expectedBmi: 25.0, actualOutput: '비만', executionTimeMs: 37, score: 20, maxScore: 20 },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: 'sub_induk_003',
      studentId: '20103',
      studentName: '박도윤',
      code: `h = float(input())\nw = float(input())\nbmi = w / ((h/100)**2)\n# 경계조건 부등호 오류 (< 25가 아니라 <= 25로 잘못 작성)\nif bmi < 18.5:\n    print("저체중")\nelif bmi < 23:\n    print("정상")\nelif bmi <= 25:\n    print("과체중")\nelse:\n    print("비만")`,
      score: 80,
      totalScore: 100,
      passedCount: 4,
      totalCount: 5,
      status: 'PARTIAL',
      results: [
        { testCaseId: 1, title: '테스트 1 (저체중 판정)', passed: true, input: { height: 170, weight: 48 }, expectedCategory: '저체중', detectedCategory: '저체중', detectedBmi: 16.61, expectedBmi: 16.61, actualOutput: '저체중', executionTimeMs: 38, score: 20, maxScore: 20 },
        { testCaseId: 2, title: '테스트 2 (정상체중 판정)', passed: true, input: { height: 160, weight: 52 }, expectedCategory: '정상체중', detectedCategory: '정상', detectedBmi: 20.31, expectedBmi: 20.31, actualOutput: '정상', executionTimeMs: 37, score: 20, maxScore: 20 },
        { testCaseId: 3, title: '테스트 3 (과체중 판정)', passed: true, input: { height: 175, weight: 72 }, expectedCategory: '과체중', detectedCategory: '과체중', detectedBmi: 23.51, expectedBmi: 23.51, actualOutput: '과체중', executionTimeMs: 39, score: 20, maxScore: 20 },
        { testCaseId: 4, title: '테스트 4 (비만 판정)', passed: true, input: { height: 180, weight: 85 }, expectedCategory: '비만', detectedCategory: '비만', detectedBmi: 26.23, expectedBmi: 26.23, actualOutput: '비만', executionTimeMs: 36, score: 20, maxScore: 20 },
        { testCaseId: 5, title: '테스트 5 (경계값 검증: BMI 25.0)', passed: false, input: { height: 170, weight: 72.25 }, expectedCategory: '비만', detectedCategory: '과체중', detectedBmi: 25.0, expectedBmi: 25.0, actualOutput: '과체중 (기대: 비만)', error: '25.0 이상은 비만이어야 하지만 과체중으로 판정되었습니다.', executionTimeMs: 40, score: 0, maxScore: 20 },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    }
  ];

  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(samples, null, 2), 'utf-8');
  return samples;
}
