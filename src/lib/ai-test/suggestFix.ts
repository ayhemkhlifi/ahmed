import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function suggestFix(
  functionCode: string,
  functionName: string,
  errorOutput: string,
  modelProvider: string,
  explanation?: string // NEW: Optional explanation parameter
): Promise<string> {
  
  // NEW: Build enhanced prompt with explanation
  const explanationSection = explanation?.trim() 
    ? `\n\nFUNCTION EXPLANATION PROVIDED BY USER:
"${explanation.trim()}"

Consider this explanation when suggesting fixes to ensure the function behaves as intended.`
    : '';

  const prompt = `You are a senior software engineer helping debug a TypeScript function that failed its tests.

FUNCTION CODE:
\`\`\`typescript
${functionCode}
\`\`\`${explanationSection}

TEST ERROR OUTPUT:
\`\`\`
${errorOutput}
\`\`\`

Please analyze the error and provide specific, actionable suggestions to fix the function. Focus on:

1. **Root Cause Analysis**: What exactly is causing the test failures?
2. **Code Issues**: Are there logic errors, edge cases not handled, or incorrect return values?
3. **Specific Fixes**: Provide concrete code changes or improvements
4. **Test Considerations**: What scenarios should the function handle better?

Provide your response in a clear, structured format with specific recommendations. If the explanation was provided, use it to better understand the intended behavior and suggest appropriate fixes.

Keep your response concise but thorough - aim for practical solutions that address the core issues.`;

  if (modelProvider === "gemini") {
    // Gemini implementation
    const body = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-goog-api-key': GEMINI_API_KEY 
        },
        body,
      },
    );
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini Error (${res.status}): ${errorText}`);
    }

    const json = (await res.json()) as any;
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No fix suggestions available';
    
  } else {
    // OpenRouter implementation
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://yourdomain.com",
      },
      body: JSON.stringify({
        model: modelProvider,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
        temperature: 0.4,
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter Error (${res.status}): ${errorText}`);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? 'No fix suggestions available';
  }
}