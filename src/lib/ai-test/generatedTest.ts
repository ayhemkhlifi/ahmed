import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function generateTest(
  functionCode: string,
  functionName: string,
  attempt: number,
  modelProvider: string
): Promise<string> {
  const returnTypeMatch = functionCode.match(
    /:\s*(\w+(?:\[\])?|\{[^}]*\}|string|number|boolean|void|any)/,
  );
  const returnType = returnTypeMatch?.[1] ?? 'unknown';

  const prompt = `You are a professional javascript test engineer. Generate a Jest test file that imports and tests a function.

STRICT REQUIREMENTS:
1. Import the function: import { ${functionName} } from '../generated-functions/${functionName}';
2. Write exactly 3 comprehensive tests:
   - Normal/typical use case with realistic inputs
   - Edge case (boundary conditions like 0, empty arrays, etc.)
   - Error case (invalid input that should throw)
   - Case where has a probability of failing
3. Use descriptive test names that explain what is being tested
4. NO function implementation in the test file - only import and tests
5. Clean, professional TypeScript syntax
6. Expected return type: ${returnType}

FUNCTION TO TEST:
\`\`\`typescript
${functionCode}
\`\`\`

EXAMPLE FORMAT (adapt for your specific function):
\`\`\`typescript
import { ${functionName} } from '../generated-functions/${functionName}';

describe('${functionName}', () => {
  it('should handle typical input correctly', () => {
    expect(${functionName}(/* realistic input */)).toBe(/* expected output */);
  });
  
  it('should handle edge cases properly', () => {
    expect(${functionName}(/* boundary input */)).toBe(/* expected output */);
  });
  
  it('should throw error for invalid input', () => {
    expect(() => ${functionName}(/* invalid input */)).toThrow();
  });
});
\`\`\`

CRITICAL: 
- Attempt ${attempt}/3 - Fix any previous syntax errors
- Return ONLY the test file content
- NO markdown formatting, NO explanations
- Make sure all test inputs/outputs match the function's actual behavior`;

  if (modelProvider === "gemini") {
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
    let raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    
    const codeMatch = raw.match(/```(?:typescript|ts)?\s*([\s\S]*?)```/);
    if (codeMatch) raw = codeMatch[1].trim();
    
    return raw.trim();
  } else {
    // OpenRouter implementation
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://yourdomain.com", // Optional but recommended
      },
      body: JSON.stringify({
        model: modelProvider,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenRouter Error (${res.status}): ${errorText}`);
    }

    const json = await res.json();
    let raw = json.choices?.[0]?.message?.content ?? "";
    
    const codeMatch = raw.match(/```(?:typescript|ts)?\s*([\s\S]*?)```/);
    if (codeMatch) raw = codeMatch[1].trim();
    
    return raw.trim();
  }
}