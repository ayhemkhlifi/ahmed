import { NextRequest, NextResponse } from 'next/server';
import { generateTest } from '@/lib/ai-test/generatedTest';
import { writeTestFile } from '@/lib/ai-test/writeTest';
import { validateTest } from '@/lib/ai-test/validateTest';
import { suggestFix } from '@/lib/ai-test/suggestFix';
import { syntaxOK } from '@/lib/ai-test/syntaxCheck';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ ok: false, error: 'No file' }, { status: 400 });

    const code = await file.text();
    const m = code.match(/(?:export\s+)?(?:function|const|let|var)\s+([a-zA-Z0-9_]+)/);
    if (!m) return NextResponse.json({ ok: false, error: 'No function name' }, { status: 400 });
    const fnName = m[1];

    let finalTestCode = '';
    let result: Awaited<ReturnType<typeof validateTest>> = { success: false, output: '', error: '' };
    let jestOutput = '';

    // 3-attempt loop
    for (let i = 1; i <= 3; i++) {
      const raw = await generateTest(code, fnName, i);
      const cleaned = raw.match(/```(?:typescript|ts)?\s*([\s\S]*?)```/)?.[1]?.trim() || raw.trim();

      const testPath = await writeTestFile(cleaned, fnName);
      const ok = await syntaxOK(cleaned);
      if (!ok) continue;

      result = await validateTest(testPath);
      
      // Capture Jest output even if tests fail
      jestOutput = result.output;
      
      if (result.success) {
        finalTestCode = cleaned;
        break;
      }
    }

    const fix = result.success ? undefined : await suggestFix(code, fnName, result.cleanError || result.output);
    return NextResponse.json({
      ok: result.success,
      testCode: finalTestCode,
      output: result.summary,  // Use the cleaned summary
      error: result.cleanError,  // Use the cleaned error
      fix,
      jestOutput: result.output  // Keep raw output for debugging
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}