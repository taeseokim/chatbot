import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { code, errorMsg, context } = await req.json();

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, error: '해석할 파이썬 코드를 먼저 입력해주세요.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            '서버에 GEMINI_API_KEY가 설정되어 있지 않습니다. Vercel 프로젝트 대시보드(Settings > Environment Variables)에 GEMINI_API_KEY를 등록해 주세요.',
        },
        { status: 500 }
      );
    }

    // 인덕과학기술고등학교 정보 교사 AI 프롬프트 설계
    const isJudgeContext = context === 'judge';

    const systemInstruction = `
당신은 대한민국 '인덕과학기술고등학교' 2학년 정보 과목의 친절하고 따뜻한 AI 파이썬 튜터 선생님입니다.
현재 과제는 '키와 몸무게를 입력받아 BMI(체질량지수)를 계산하고, 조건문(if-elif-else)을 통해 저체중, 정상체중, 과체중, 비만을 판정하는 프로그램'입니다.

[지침]
1. 학생의 눈높이에 맞춰 이해하기 쉽고 친절한 존댓말(해요체)로 설명해 주세요.
2. 학생이 작성한 코드를 한 줄 한 줄 또는 핵심 블록별로 한국어로 무슨 의미인지 알기 쉽게 번역/해설해 주세요.
   - 예: input(), float(), 키를 m 단위로 변환하는 부분, ** 2 (거듭제곱), if/elif/else 조건문
3. 만약 학생의 코드에 에러(문법 에러, 런타임 에러)나 논리적 오류(예: 부등호 방향 실수, 경계값 25 미포함, m 단위 변환 누락 등)가 있다면:
   - ⚠️ 절대 정답 코드를 완성형으로 전부 복사해서 주지 마세요! (스스로 생각하고 고쳐야 수행평가 점수를 받을 수 있습니다)
   - "어느 줄의 어떤 부분을 다시 살펴보면 좋을지" 친절한 생각의 힌트와 질문을 던져주세요.
4. 마크다운(Markdown)과 이모지를 활용하여 깔끔하고 가독성 좋게 출력해 주세요.
`;

    const userPrompt = `
[학생이 작성한 파이썬 코드]
\`\`\`python
${code}
\`\`\`

${errorMsg ? `[발생한 오류 또는 채점 피드백]\n${errorMsg}\n` : ''}
${isJudgeContext ? '학생이 채점 후 오답이 발생하여 힌트와 원인을 알고 싶어합니다. 정답 코드를 바로 주지 마시고, 왜 그런 결과가 나왔는지와 스스로 고칠 수 있는 힌트를 주세요.' : '이 코드가 어떤 동작을 하는지 한 줄 한 줄 알기 쉽게 한국어로 해석해 주시고, 칭찬과 함께 개선 팁을 주세요.'}
`;

    const model = 'gemini-3.6-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return NextResponse.json(
        { success: false, error: data.error?.message || 'Gemini API 호출에 실패했습니다.' },
        { status: 500 }
      );
    }

    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!explanation) {
      return NextResponse.json(
        { success: false, error: 'AI 해설을 생성하지 못했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      explanation,
    });
  } catch (error: unknown) {
    console.error('Explain API Route Error:', error);
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

