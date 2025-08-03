import { spawn } from 'child_process';
import path from 'path';
import { TSC, JEST } from './paths';

export interface TestResult {
  success: boolean;
  output: string;
  error?: string;
}

export async function validateTest(testPath: string): Promise<TestResult> {
  return new Promise((resolve) => {
    const root = process.cwd();

    // 1. Type-check
    const tsc = spawn(
      process.platform === 'win32' ? 'node' : TSC,
      [process.platform === 'win32' ? TSC : '', '--noEmit', testPath].filter(Boolean),
      { cwd: root, shell: process.platform === 'win32' }
    );
    let tscErr = '';
    tsc.stderr?.on('data', (d) => (tscErr += d));
    tsc.on('close', (code) => {
      if (code !== 0) {
        return resolve({ success: false, output: '', error: `tsc: ${tscErr}` });
      }

      // 2. Run Jest
      const jest = spawn(
        process.platform === 'win32' ? 'node' : JEST,
        [process.platform === 'win32' ? JEST : '', path.basename(testPath), '--colors'].filter(Boolean),
        { cwd: root, shell: process.platform === 'win32' }
      );
      let out = '';
      jest.stdout.on('data', (d) => (out += d));
      jest.stderr.on('data', (d) => (out += d));
      jest.on('close', (c) => resolve({ success: c === 0, output: out }));
    });
  });
}