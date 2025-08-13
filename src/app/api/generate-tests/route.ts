import { NextRequest, NextResponse } from 'next/server';
import { generateTest } from '@/lib/ai-test/generatedTest';
import { writeTestFile } from '@/lib/ai-test/writeTest';
import { writeSourceFile, cleanupSourceFile } from '@/lib/ai-test/writeSourceFile';
import { validateTest } from '@/lib/ai-test/validateTest';
import { suggestFix } from '@/lib/ai-test/suggestFix';
import { syntaxOK } from '@/lib/ai-test/syntaxCheck';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let fnName = '';
  let testFilesCreated: string[] = [];
  
  try {
    const form = await req.formData();
    
    // Get code from either pasted text or uploaded file
    let code = '';
    const pastedCode = form.get('code') as string | null;
    const file = form.get('file') as File | null;
    // NEW: Get selected model
    const model = form.get('model') as string | null || 'gemini'; // Default to Gemini
    
    if (pastedCode && pastedCode.trim()) {
      code = pastedCode.trim();
      console.log('📝 Using pasted code');
    } else if (file) {
      code = await file.text();
      console.log('📁 Using uploaded file:', file.name);
    } else {
      return NextResponse.json({ 
        ok: false, 
        error: 'No code provided. Please either paste code or upload a file.' 
      }, { status: 400 });
    }

    if (!code.trim()) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Empty code provided.' 
      }, { status: 400 });
    }

    // Extract function name
    const functionMatch = code.match(/(?:export\s+)?(?:function|const|let|var)\s+([a-zA-Z0-9_]+)/);
    if (!functionMatch) {
      return NextResponse.json({ 
        ok: false, 
        error: 'No function found in the code. Make sure your code contains a function declaration.' 
      }, { status: 400 });
    }
    
    fnName = functionMatch[1];
    console.log(`🔍 Found function: ${fnName}`);
    console.log(`🤖 Selected model: ${model}`); // Log selected model

    // Step 1: Write the source file FIRST and keep it during testing
    const sourcePath = await writeSourceFile(code, fnName);
    console.log(`📄 Source file created: ${sourcePath}`);
    
    let finalTestCode = '';
    let result: Awaited<ReturnType<typeof validateTest>> = { success: false, output: '', error: '' };
    let jestOutput = '';

    // Step 2: Generate and validate tests (3 attempts)
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🔄 Attempt ${attempt}/3 - Generating tests...`);
      
      try {
        // Generate test code that imports the function - pass model parameter
        const rawTestCode = await generateTest(code, fnName, attempt, model);
        const cleanedTestCode = rawTestCode.match(/```(?:typescript|ts)?\s*([\s\S]*?)```/)?.[1]?.trim() || rawTestCode.trim();

        // Write the test file
        const testPath = await writeTestFile(cleanedTestCode, fnName);
        testFilesCreated.push(testPath);
        console.log(`📄 Test file created: ${testPath}`);
        
        // Run basic syntax check
        const syntaxValid = await syntaxOK(cleanedTestCode, fnName);
        if (!syntaxValid) {
          console.log(`⚠️ Syntax check warning for attempt ${attempt} - continuing anyway`);
        } else {
          console.log(`✅ Syntax check passed for attempt ${attempt}`);
        }

        // Run the tests directly
        result = await validateTest(testPath);
        jestOutput = result.output;
        
        if (result.success) {
          finalTestCode = cleanedTestCode;
          console.log(`🎉 Tests passed on attempt ${attempt}!`);
          break;
        } else {
          console.log(`❌ Tests failed on attempt ${attempt}`);
          console.log('Error:', result.error || result.cleanError);
          console.log('Summary:', result.summary);
        }
      } catch (attemptError: any) {
        console.error(`❌ Attempt ${attempt} encountered error:`, attemptError.message);
        continue;
      }
    }

    // Step 3: Generate fix suggestions if all attempts failed - pass model parameter
    let fixSuggestions = undefined;
    if (!result.success) {
      console.log('🔧 Generating fix suggestions...');
      try {
        fixSuggestions = await suggestFix(
          code, 
          fnName, 
          result.cleanError || result.error || result.output,
          model // Pass model to suggestFix
        );
      } catch (fixError) {
        console.warn('Could not generate fix suggestions:', fixError);
        fixSuggestions = 'Unable to generate fix suggestions. Please check your function implementation.';
      }
    }

    console.log('📊 Final Result:', {
      success: result.success,
      hasTestCode: !!finalTestCode,
      hasOutput: !!result.output,
      hasError: !!result.error
    });

    // Return the results
    return NextResponse.json({
      ok: result.success,
      testCode: finalTestCode,
      output: result.summary || 'Test execution completed',
      error: result.cleanError || result.error,
      fix: fixSuggestions,
      jestOutput: jestOutput,
      modelUsed: model // Return which model was used
    });

  } catch (error: any) {
    console.error('❌ API Error:', error);
    
    // Enhanced error messages based on model
    let detailedError = `Server error: ${error.message}`;
    if (error.message.includes('Gemini')) {
      detailedError = 'Gemini API Error: ' + error.message;
    } else if (error.message.includes('OpenRouter')) {
      detailedError = 'OpenRouter API Error: ' + error.message;
    }
    
    return NextResponse.json({ 
      ok: false, 
      error: detailedError 
    }, { status: 500 });
  } 
  
}