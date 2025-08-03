import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { TSC } from './paths';

export async function syntaxOK(code: string): Promise<boolean> {
  const tmpPath = path.join(process.cwd(), '__tests__', '_tmp.ts');
  fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
  fs.writeFileSync(tmpPath, code);

  return new Promise((resolve) => {
    const tsc = spawn(
      process.platform === 'win32' ? 'node' : TSC,
      [process.platform === 'win32' ? TSC : '', '--noEmit', tmpPath].filter(Boolean),
      { cwd: process.cwd(), shell: process.platform === 'win32' }
    );
    tsc.on('close', (code) => {
      fs.unlinkSync(tmpPath);
      resolve(code === 0);
    });
  });
}