import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

export async function suggestFix(
  functionCode: string,
  functionName: string,
  testOutput: string): Promise<string> {
  const prompt = `You are an expert TypeScript developer.

Function name: "${functionName}"
Code:
\`\`\`ts
${functionCode}
\`\`\`

Test failure:\`\`\`
${testOutput}
\`\`\`

Give concise fix suggestions.`;

  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
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
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No suggestions.';}