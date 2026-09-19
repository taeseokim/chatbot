import { NextRequest, NextResponse } from 'next/server';
import { runSingle, checkCodeSecurity } from '@/lib/judge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, height, weight } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({ success: false, error: '실행할 코드가 없습니다.' }, { status: 400 });
    }

    const numHeight = parseFloat(height);
    const numWeight = parseFloat(weight);

    if (isNaN(numHeight) || numHeight <= 0) {
      return NextResponse.json({ success: false, error: '올바른 키(cm) 값을 입력해주세요.' }, { status: 400 });
    }
    if (isNaN(numWeight) || numWeight <= 0) {
      return NextResponse.json({ success: false, error: '올바른 몸무게(kg) 값을 입력해주세요.' }, { status: 400 });
    }

    const security = checkCodeSecurity(code);
    if (!security.safe) {
      return NextResponse.json({ success: false, error: security.reason }, { status: 400 });
    }

    const result = await runSingle(code, numHeight, numWeight);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '실행 중 오류가 발생했습니다.';
    if (message.includes('ENOENT')) {
      return NextResponse.json({
        success: false,
        error: '서버에 Python이 설치되어 있지 않습니다. 브라우저 파이썬 엔진으로 자동 전환됩니다.',
      }, { status: 200 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

