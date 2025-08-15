import { spawn } from 'child_process';
import path from 'path';

export interface TestResult {
  success: boolean;
  output: string;
  error?: string;
  summary?: string;
  cleanError?: string;
}

export async function validateTest(testPath: string): Promise<TestResult> {
  return new Promise((resolve) => {
    console.log(`🧪 Running Jest tests for: ${path.basename(testPath)}`);
    
    const jest = spawn('npx', ['jest', path.basename(testPath), '--verbose', '--no-coverage', '--colors=no'], {
      cwd: path.dirname(testPath),
      shell: true,
      stdio: 'pipe'
    });
    
    let output = '';
    
    jest.stdout?.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
    });
    
    jest.stderr?.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
    });
    
    jest.on('close', (code) => {
      const { summary, cleanError } = parseJestOutput(output);
      
      console.log(`🏁 Jest finished with code: ${code}`);
      if (code === 0) {
        console.log('✅ All tests passed!');
      } else {
        console.log('❌ Some tests failed');
        if (cleanError) {
          console.log('Error details:', cleanError);
        }
      }
      
      resolve({ 
        success: code === 0,
        output: output,
        summary,
        cleanError,
        error: cleanError, // For backward compatibility
      });
    });
    
    jest.on('error', (error) => {
      console.error('❌ Jest process error:', error);
      resolve({
        success: false,
        output: `Jest process failed: ${error.message}`,
        error: error.message,
        summary: 'Test execution failed'
      });
    });
  });
}

function parseJestOutput(rawOutput: string): { summary: string; cleanError?: string } {
  // Extract test summary (the final results)
  const summaryMatch = rawOutput.match(
    /Test Suites:.+(?:\n.*Tests:.+)?(?:\n.*Snapshots:.+)?(?:\n.*Time:.+)?(?:\n.*Ran all test suites.*)?/m
  );
  let summary = summaryMatch ? summaryMatch[0].trim() : 'Test summary not available';
  
  // If no proper summary found, try to extract basic info
  if (summary === 'Test summary not available') {
    const simpleMatch = rawOutput.match(/(\d+ passing|\d+ failing)/g);
    if (simpleMatch) {
      summary = simpleMatch.join(', ');
    }
  }

  // Extract and clean error messages
  let cleanError: string | undefined;
  
  // Look for various types of errors
  const errorPatterns = [
    // Syntax errors
    /SyntaxError: (.+?)(?:\n\s+at|$)/s,
    // Type errors
    /TypeError: (.+?)(?:\n\s+at|$)/s,
    // Reference errors
    /ReferenceError: (.+?)(?:\n\s+at|$)/s,
    // Import errors
    /Cannot find module (.+?)(?:\n|$)/s,
    // Jest errors
    /Error: (.+?)(?:\n\s+at|$)/s,
    // Test failures
    /Expected .+ but received .+/,
  ];
  
  for (const pattern of errorPatterns) {
    const match = rawOutput.match(pattern);
    if (match) {
      cleanError = match[0]
        .replace(/\s+at .*/g, '') // Remove stack traces
        .replace(/\n\s+/g, '\n')  // Clean up indentation
        .trim();
      break;
    }
  }
  
  // If no specific error pattern matched, try to extract the most relevant error
  if (!cleanError && rawOutput.includes('FAIL')) {
    const failMatch = rawOutput.match(/FAIL.*?\n(.*?)(?:\n\n|\n.*?at |$)/s);
    if (failMatch) {
      cleanError = failMatch[1].trim();
    }
  }

  return { summary, cleanError };
}