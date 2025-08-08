import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

export async function generateTest(
  functionCode: string,
  functionName: string,
  attempt: number
): Promise<string> {
  // 1. Infer the real return type
  const returnTypeMatch = functionCode.match(
    /:\s*(\w+(?:\[\])?|\{[^}]*\}|string|number|boolean|void|any)/,
  );
  const returnType = returnTypeMatch?.[1] ?? 'unknown';

  const prompt = `You are a concise Jest generator.

RULES  
1. Paste the source code **exactly** below (no import/export).  
2. Return type must match **\`${returnType}\`**.  
3. **No semicolon after last brace**.  
4. **Exactly 3 tests** (normal, edge, error) to stay within 8 kB.  
5. **No comments or headers**.
6. **Do not include type assertions like "as any"** - let TypeScript catch type errors naturally.

SOURCE  
\`\`\`ts
${functionCode}
\`\`\`

TEST SUITE  
describe("${functionName}", () => {
  it("handles normal case", () => expect(${functionName}(...)).toBe(...));
  it("handles edge case", () => expect(${functionName}(...)).toBe(...));
  it("throws on invalid", () => expect(() => ${functionName}(...)).toThrow());
});

function ${functionName}(...) { /* iterative implementation */ }
\`\`\`

⚠️ Attempt ${attempt}/3 – fix prior syntax errors.  

Return **only** the file wrapped in \`\`\`ts … \`\`\`.`;

  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body,
    },
  );
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Gemini Error (${res.status}): ${errorText}`);
    throw new Error(`Gemini Error (${res.status})`);
  }

  const json = (await res.json()) as any;
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return raw;
}