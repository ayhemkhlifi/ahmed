import fetch from 'node-fetch';

export async function deepSeekRequest(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY!;
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-coder",
        messages: [
          {
            role: "system",
            content: "You are an expert TypeScript developer and testing specialist."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`DeepSeek Error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    throw error;
  }
}