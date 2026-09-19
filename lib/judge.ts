import { spawn } from 'child_process';
import { TestCase, TestCaseResult, BmiCategory, RunSingleResult } from './types';

// 수행평가 5대 공식 테스트케이스
export const TEST_CASES: TestCase[] = [
  {
    id: 1,
    title: '테스트 1: 저체중 판정 케이스',
    description: '키 170cm, 몸무게 48kg (BMI 약 16.61)',
    height: 170,
    weight: 48,
    expectedBmi: 16.61,
    expectedCategory: '저체중',
    score: 20,
    isHidden: false,
  },
  {
    id: 2,
    title: '테스트 2: 정상체중 판정 케이스',
    description: '키 160cm, 몸무게 52kg (BMI 약 20.31)',
    height: 160,
    weight: 52,
    expectedBmi: 20.31,
    expectedCategory: '정상체중',
    score: 20,
    isHidden: false,
  },
  {
    id: 3,
    title: '테스트 3: 과체중 판정 케이스',
    description: '키 175cm, 몸무게 72kg (BMI 약 23.51)',
    height: 175,
    weight: 72,
    expectedBmi: 23.51,
    expectedCategory: '과체중',
    score: 20,
    isHidden: false,
  },
  {
    id: 4,
    title: '테스트 4: 비만 판정 케이스',
    description: '키 180cm, 몸무게 85kg (BMI 약 26.23)',
    height: 180,
    weight: 85,
    expectedBmi: 26.23,
    expectedCategory: '비만',
    score: 20,
    isHidden: false,
  },
  {
    id: 5,
    title: '테스트 5: 경계값 정밀 검증 (비만 경계 25.0)',
    description: '키 150cm, 몸무게 56.25kg (BMI 정확히 25.00 -> 비만)',
    height: 150,
    weight: 56.25,
    expectedBmi: 25.0,
    expectedCategory: '비만',
    score: 20,
    isHidden: true,
  },
];

// 금지 구문 검사
export function checkCodeSecurity(code: string): { safe: boolean; reason?: string } {
  const dangerousPatterns = [
    /import\s+os/i,
    /import\s+subprocess/i,
    /import\s+shutil/i,
    /from\s+os\s+import/i,
    /from\s+subprocess\s+import/i,
    /__import__\s*\(/i,
    /open\s*\(\s*['"].*?['"]\s*,\s*['"][wa\+]/i, // 쓰기/삭제 모드 차단
    /exec\s*\(/i,
    /eval\s*\(/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return {
        safe: false,
        reason: '보안 정책상 시스템 접근(os, subprocess, exec, 파일 쓰기 등) 코드는 실행할 수 없습니다.',
      };
    }
  }
  return { safe: true };
}

// 파이썬 프로세스 실행 헬퍼
function executePython(code: string, stdinText: string, timeoutMs = 3500): Promise<{ stdout: string; stderr: string; timedOut: boolean }> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Windows 환경에서 python 또는 py 호출
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    // -u 옵션으로 stdout 버퍼링 비활성화, -X utf8 옵션으로 한글 UTF-8 인코딩 보장
    const proc = spawn(pythonCmd, ['-X', 'utf8', '-u', '-c', code], {
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
      },
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        proc.kill('SIGKILL');
      } catch {
        // 무시
      }
    }, timeoutMs);

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('error', (err) => {
      stderr += `실행 오류: ${err.message}`;
      clearTimeout(timer);
      resolve({ stdout, stderr, timedOut: false });
    });

    proc.on('close', () => {
      clearTimeout(timer);
      resolve({ stdout, stderr, timedOut });
    });

    // stdin 입력 주입
    if (stdinText) {
      try {
        proc.stdin.write(stdinText);
        proc.stdin.end();
      } catch {
        // 이미 닫혔거나 종료된 경우
      }
    } else {
      proc.stdin.end();
    }
  });
}

// 지능형 출력 판정
export function analyzeOutput(output: string, expected: BmiCategory): {
  passed: boolean;
  detectedCategory?: string;
  detectedBmi?: number;
  reason?: string;
} {
  // 1. BMI 숫자 추출 (소수점 포함 숫자)
  const bmiMatch = output.match(/bmi\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i);
  let detectedBmi: number | undefined;
  if (bmiMatch) {
    detectedBmi = parseFloat(bmiMatch[1]);
  }

  // 2. 4단계 카테고리 키워드 추출
  // 긴 단어부터 검사하여 '정상체중', '저체중', '과체중', '비만', '정상' 순서 파악
  const cleaned = output.replace(/\s+/g, ' ');

  // 학생 출력에서 등장한 판정 키워드 수집 (끝부분 또는 결과부 추출)
  // 우선 가장 마지막에 출력된 키워드를 판정 결과로 봄
  const keywords = ['저체중', '정상체중', '과체중', '고도비만', '비만', '정상'];
  const occurrences: { keyword: string; index: number }[] = [];

  for (const kw of keywords) {
    let pos = cleaned.lastIndexOf(kw);
    if (pos !== -1) {
      occurrences.push({ keyword: kw, index: pos });
    }
  }

  if (occurrences.length === 0) {
    return {
      passed: false,
      detectedBmi,
      reason: '출력문에서 판정 결과(저체중, 정상, 과체중, 비만)를 찾을 수 없습니다.',
    };
  }

  // 가장 마지막에 나온 키워드 선택
  occurrences.sort((a, b) => b.index - a.index);
  const detected = occurrences[0].keyword;
  
  // '정상'과 '정상체중'은 동일하게 취급
  const normalizedDetected: BmiCategory | string =
    detected === '정상' ? '정상체중' : (detected === '고도비만' ? '비만' : detected);

  const normalizedExpected: BmiCategory | string = expected;

  const passed = normalizedDetected === normalizedExpected;

  return {
    passed,
    detectedCategory: detected,
    detectedBmi,
    reason: passed
      ? undefined
      : `기대 판정: '${expected}', 학생 판정: '${detected}'`,
  };
}

// 5개 테스트케이스 저지 실행
export async function runJudge(code: string): Promise<{
  passedCount: number;
  totalCount: number;
  score: number;
  totalScore: number;
  results: TestCaseResult[];
}> {
  const results: TestCaseResult[] = [];
  let passedCount = 0;
  let totalScore = 0;
  let score = 0;

  for (const tc of TEST_CASES) {
    totalScore += tc.score;
    // 학생 코드에 cm, kg 입력 (순서대로 줄바꿈 제공)
    const stdin = `${tc.height}\n${tc.weight}\n`;
    const start = Date.now();

    const { stdout, stderr, timedOut } = await executePython(code, stdin);
    const executionTimeMs = Date.now() - start;

    if (timedOut) {
      results.push({
        testCaseId: tc.id,
        title: tc.title,
        passed: false,
        input: { height: tc.height, weight: tc.weight },
        expectedCategory: tc.expectedCategory,
        expectedBmi: tc.expectedBmi,
        actualOutput: stdout.trim() || '(시간 초과)',
        error: '실행 시간 초과 (3.5초 초과). 무한 루프(while문 등)가 없는지 확인하세요.',
        executionTimeMs,
        score: 0,
        maxScore: tc.score,
      });
      continue;
    }

    if (stderr && stderr.trim().length > 0 && !stdout.trim()) {
      results.push({
        testCaseId: tc.id,
        title: tc.title,
        passed: false,
        input: { height: tc.height, weight: tc.weight },
        expectedCategory: tc.expectedCategory,
        expectedBmi: tc.expectedBmi,
        actualOutput: '',
        error: translatePythonError(stderr),
        executionTimeMs,
        score: 0,
        maxScore: tc.score,
      });
      continue;
    }

    const analysis = analyzeOutput(stdout, tc.expectedCategory);

    if (analysis.passed) {
      passedCount++;
      score += tc.score;
    }

    results.push({
      testCaseId: tc.id,
      title: tc.title,
      passed: analysis.passed,
      input: { height: tc.height, weight: tc.weight },
      expectedCategory: tc.expectedCategory,
      detectedCategory: analysis.detectedCategory,
      detectedBmi: analysis.detectedBmi,
      expectedBmi: tc.expectedBmi,
      actualOutput: stdout.trim(),
      error: analysis.reason,
      executionTimeMs,
      score: analysis.passed ? tc.score : 0,
      maxScore: tc.score,
    });
  }

  return {
    passedCount,
    totalCount: TEST_CASES.length,
    score,
    totalScore,
    results,
  };
}

// 단일 테스트 실행 (학생이 직접 실행해볼 때)
export async function runSingle(code: string, height: number, weight: number): Promise<RunSingleResult> {
  const stdin = `${height}\n${weight}\n`;
  const start = Date.now();
  const { stdout, stderr, timedOut } = await executePython(code, stdin);
  const executionTimeMs = Date.now() - start;

  if (timedOut) {
    return {
      success: false,
      output: '',
      error: '실행 시간 초과: 프로그램이 3.5초 이내에 끝나지 않았습니다.',
      executionTimeMs,
    };
  }

  if (stderr && stderr.trim()) {
    return {
      success: false,
      output: stdout,
      error: translatePythonError(stderr),
      executionTimeMs,
    };
  }

  return {
    success: true,
    output: stdout,
    executionTimeMs,
  };
}

// 파이썬 에러 친절한 한국어 번역 가이드
function translatePythonError(err: string): string {
  if (err.includes('SyntaxError')) {
    return `문법 오류 (SyntaxError): 콜론(:), 괄호 짝, 또는 따옴표가 빠졌는지 확인하세요.\n${err}`;
  }
  if (err.includes('IndentationError')) {
    return `들여쓰기 오류 (IndentationError): if, elif, else 아래 코드의 들여쓰기(스페이스 4칸 또는 탭)를 확인하세요.\n${err}`;
  }
  if (err.includes('ValueError')) {
    return `값 변환 오류 (ValueError): input()으로 받은 값을 float() 또는 int()로 올바르게 변환했는지 확인하세요.\n${err}`;
  }
  if (err.includes('ZeroDivisionError')) {
    return `0으로 나누기 오류 (ZeroDivisionError): 키가 0이거나 계산식에서 분모가 0이 되지 않는지 확인하세요.\n${err}`;
  }
  if (err.includes('NameError')) {
    return `변수 이름 오류 (NameError): 정의되지 않은 변수를 사용했거나 철자 오타가 있는지 확인하세요.\n${err}`;
  }
  return err;
}
