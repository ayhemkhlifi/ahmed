import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

export async function generateTest(
  functionCode: string,
  functionName: string,
  attempt: number
): Promise<string> {
  const prompt = `You are a Jest generator.

RULES  
1. PASTE the source code **exactly** below (do NOT import it).  
2. Write the Jest test suite **under** it.  
3. **ZERO** imports/requires.  
4. Must compile with \`tsc --noEmit\` and pass Jest.  

SOURCE  
\`\`\`ts
${functionCode}
\`\`\`

TEST SUITE  
- describe, it, expect, toBe, toThrow  
- Cover normal, edge, error cases  

⚠️ Attempt ${attempt}/3 – fix prior syntax errors.  

Return **ONLY** the full file wrapped in \`\`\`ts … \`\`\`.`;

  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body,
    }
  );
  if (!res.ok) throw new Error(`Gemini Error (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as any;
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const m = raw.match(/```(?:typescript|ts)?\s*([\s\S]*?)```/);
  return m ? m[1].trim() : raw.trim();
}