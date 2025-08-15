import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function suggestFix(
  functionCode: string,
  functionName: string,
  testOutput: string,
  modelProvider: string = 'gemini' // Default to Gemini
): Promise<string> {
  const prompt = `You are an expert TypeScript developer.

Function name: "${functionName}"
Code:
\`\`\`ts
${functionCode}
\`\`\`

Test failure:\`\`\`
${testOutput}
\`\`\`

Give concise fix suggestions following these rules:
1. Focus on the exact error shown in the test output
2. Suggest minimal changes to fix the issue
3. Explain why the fix works
4. If multiple solutions exist, list them all
5. Format as bullet points with clear explanations

Example format:
- Fix: Change X to Y
  Reason: The test expects Y when Z occurs
- Alternative: Add null check for parameter A
  Reason: The error occurs when A is undefined`;

  if (modelProvider === 'gemini') {
    // Gemini implementation
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

    if (!res.ok) {
      throw new Error(`Gemini Error (${res.status}): ${await res.text()}`);
    }

    const json = (await res.json()) as any;
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No suggestions from Gemini.';
  } else {
    // OpenRouter implementation
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://yourdomain.com', // Recommended by OpenRouter
        },
        body: JSON.stringify({
          model: modelProvider,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3, // Lower for more focused suggestions
          max_tokens: 1000,
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenRouter Error (${res.status}): ${await res.text()}`);
      }

      const json = await res.json();
      return json.choices?.[0]?.message?.content ?? 'No suggestions from OpenRouter.';
    } catch (error) {
      console.error('OpenRouter suggestFix error:', error);
      return 'Failed to get suggestions from OpenRouter. Please try again.';
    }
  }
}