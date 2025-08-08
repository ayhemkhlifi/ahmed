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
    const jest = spawn('npx', ['jest', path.basename(testPath), '--colors=no'], {
      cwd: path.dirname(testPath),
      shell: true,
    });
    
    let output = '';
    
    jest.stdout.on('data', (data) => (output += data.toString()));
    jest.stderr.on('data', (data) => (output += data.toString()));
    
    jest.on('close', (code) => {
      const { summary, cleanError } = parseJestOutput(output);
      resolve({ 
        success: code === 0,
        output: output,
        summary,
        cleanError,
      });
    });
  });
}

function parseJestOutput(rawOutput: string): { summary: string; cleanError?: string } {
  // Extract the summary
  const summaryMatch = rawOutput.match(
    /Test Suites:.+\nTests:.+\nSnapshots:.+\nTime:.+\nRan all test suites/
  );
  const summary = summaryMatch ? summaryMatch[0] : 'Test summary not available';

  // Extract and clean the error message
  const errorMatch = rawOutput.match(/SyntaxError:.+?\n\s+at/m);
  let cleanError = errorMatch 
    ? errorMatch[0]
      .replace(/\s+at.*/g, '') // Remove stack trace
      .replace(/\n\s+/g, '\n') // Clean up indentation
      .trim()
    : undefined;

  return { summary, cleanError };
}