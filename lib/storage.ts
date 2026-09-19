import fs from 'fs';
import path from 'path';
import os from 'os';
import { Submission } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

// Vercel / AWS Lambda 같은 서버리스 환경 감지
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

// 로컬 환경은 프로젝트 폴더의 data/, 서버리스는 /tmp 디렉토리 사용 (EROFS 방지)
const DATA_DIR = isServerless ? os.tmpdir() : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'induk_submissions.json');

// 파일 쓰기 불가 환경을 대비한 인메모리 폴백 캐시
let memoryFallback: Submission[] = [];

function dbToSubmission(row: any): Submission {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    code: row.code,
    score: row.score,
    totalScore: row.total_score,
    passedCount: row.passed_count,
    totalCount: row.total_count,
    status: row.status,
    results: typeof row.results === 'string' ? JSON.parse(row.results) : row.results,
    createdAt: row.created_at,
  };
}

function submissionToDb(sub: Submission) {
  return {
    id: sub.id,
    student_id: sub.studentId,
    student_name: sub.studentName,
    code: sub.code,
    score: sub.score,
    total_score: sub.totalScore,
    passed_count: sub.passedCount,
    total_count: sub.totalCount,
    status: sub.status,
    results: sub.results,
    created_at: sub.createdAt,
  };
}

function ensureLocalFile(): string {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
    return DATA_FILE;
  } catch {
    const tmpFile = path.join(os.tmpdir(), 'induk_submissions.json');
    try {
      if (!fs.existsSync(tmpFile)) {
        fs.writeFileSync(tmpFile, JSON.stringify([], null, 2), 'utf-8');
      }
      return tmpFile;
    } catch {
      return '';
    }
  }
}

// 1. 전체 학생 제출 목록 조회
export async function getAllSubmissions(): Promise<Submission[]> {
  // A. Supabase 연결된 경우
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(dbToSubmission);
      }
      console.warn('[Storage] Supabase 조회 실패, 로컬 폴백 사용:', error?.message);
    } catch (err) {
      console.warn('[Storage] Supabase 예외 발생, 로컬 폴백 사용:', err);
    }
  }

  // B. 로컬 파일 및 인메모리 폴백
  const targetFile = ensureLocalFile();
  if (!targetFile) return memoryFallback;

  try {
    const raw = fs.readFileSync(targetFile, 'utf-8');
    const parsed = JSON.parse(raw) as Submission[];
    if (parsed.length === 0 && memoryFallback.length > 0) {
      return memoryFallback;
    }
    return parsed;
  } catch {
    return memoryFallback;
  }
}

// 2. 학생 제출 저장
export async function saveSubmission(submission: Submission): Promise<void> {
  // A. Supabase 연결된 경우
  if (isSupabaseConfigured() && supabase) {
    try {
      const dbRow = submissionToDb(submission);
      const { error } = await supabase
        .from('submissions')
        .upsert(dbRow, { onConflict: 'id' });

      if (!error) {
        return;
      }
      console.warn('[Storage] Supabase 저장 실패, 로컬 폴백 사용:', error?.message);
    } catch (err) {
      console.warn('[Storage] Supabase 저장 예외, 로컬 폴백 사용:', err);
    }
  }

  // B. 로컬 파일 및 인메모리 저장 (EROFS 방어)
  memoryFallback = [submission, ...memoryFallback.filter((s) => s.id !== submission.id)];
  const targetFile = ensureLocalFile();
  if (targetFile) {
    try {
      const list = memoryFallback;
      fs.writeFileSync(targetFile, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Storage] 파일 저장 실패 (인메모리 유지):', err);
    }
  }
}

// 3. 특정 제출 삭제
export async function deleteSubmission(id: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('submissions').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('[Storage] Supabase 삭제 오류:', err);
    }
  }

  memoryFallback = memoryFallback.filter((s) => s.id !== id);
  const targetFile = ensureLocalFile();
  if (targetFile) {
    try {
      fs.writeFileSync(targetFile, JSON.stringify(memoryFallback, null, 2), 'utf-8');
      return true;
    } catch {
      // 무시
    }
  }
  return true;
}

// 4. 전체 제출 초기화
export async function resetSubmissions(): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('submissions').delete().neq('id', 'keep_empty');
    } catch (err) {
      console.warn('[Storage] Supabase 리셋 오류:', err);
    }
  }

  memoryFallback = [];
  const targetFile = ensureLocalFile();
  if (targetFile) {
    try {
      fs.writeFileSync(targetFile, JSON.stringify([], null, 2), 'utf-8');
    } catch {
      // 무시
    }
  }
}

// 5. 시연용 샘플 데이터 생성
export async function seedSampleSubmissions(): Promise<Submission[]> {
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
        { testCaseId: 1, title: '테스트 1 (저체중 판정)', passed: true, input: { height: 170, weight: 48 }, expectedCategory: '저체중', detectedCategory: '저체중', detectedBmi: 16.61, expectedBmi: 16.61, actualOutput: 'BMI: 16.61\n저체중', executionTimeMs: 42, score: 20, maxScore: 20 },
        { testCaseId: 2, title: '테스트 2 (정상체중 판정)', passed: true, input: { height: 160, weight: 52 }, expectedCategory: '정상체중', detectedCategory: '정상체중', detectedBmi: 20.31, expectedBmi: 20.31, actualOutput: 'BMI: 20.31\n정상체중', executionTimeMs: 38, score: 20, maxScore: 20 },
        { testCaseId: 3, title: '테스트 3 (과체중 판정)', passed: true, input: { height: 175, weight: 72 }, expectedCategory: '과체중', detectedCategory: '과체중', detectedBmi: 23.51, expectedBmi: 23.51, actualOutput: 'BMI: 23.51\n과체중', executionTimeMs: 40, score: 20, maxScore: 20 },
        { testCaseId: 4, title: '테스트 4 (비만 판정)', passed: true, input: { height: 180, weight: 85 }, expectedCategory: '비만', detectedCategory: '비만', detectedBmi: 26.23, expectedBmi: 26.23, actualOutput: 'BMI: 26.23\n비만', executionTimeMs: 39, score: 20, maxScore: 20 },
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
        { testCaseId: 5, title: '테스트 5 (경계값 검증: BMI 25.0)', passed: true, input: { height: 150, weight: 56.25 }, expectedCategory: '비만', detectedCategory: '비만', detectedBmi: 25.0, expectedBmi: 25.0, actualOutput: '비만', executionTimeMs: 37, score: 20, maxScore: 20 },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: 'sub_induk_003',
      studentId: '20103',
      studentName: '박도윤',
      code: `h = float(input())\nw = float(input())\nbmi = w / ((h/100)**2)\nif bmi < 18.5:\n    print("저체중")\nelif bmi < 23:\n    print("정상")\nelif bmi <= 25:\n    print("과체중")\nelse:\n    print("비만")`,
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
        { testCaseId: 5, title: '테스트 5 (경계값 검증: BMI 25.0)', passed: false, input: { height: 150, weight: 56.25 }, expectedCategory: '비만', detectedCategory: '과체중', detectedBmi: 25.0, expectedBmi: 25.0, actualOutput: '과체중 (기대: 비만)', error: '25.0 이상은 비만이어야 하지만 과체중으로 판정되었습니다.', executionTimeMs: 40, score: 0, maxScore: 20 },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    }
  ];

  if (isSupabaseConfigured() && supabase) {
    try {
      const rows = samples.map(submissionToDb);
      await supabase.from('submissions').upsert(rows, { onConflict: 'id' });
    } catch (err) {
      console.warn('[Storage] Supabase 시드 실패:', err);
    }
  }

  memoryFallback = samples;
  const targetFile = ensureLocalFile();
  if (targetFile) {
    try {
      fs.writeFileSync(targetFile, JSON.stringify(samples, null, 2), 'utf-8');
    } catch {
      // 무시
    }
  }
  return samples;
}
