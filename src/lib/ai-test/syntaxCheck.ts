import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function syntaxOK(code: string): Promise<boolean> {
  const tmpPath = path.join(process.cwd(), '__tests__', '_tmp.ts');
  fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
  fs.writeFileSync(tmpPath, code);

  return new Promise((resolve) => {
    const tsc = spawn('npx', ['tsc', '--noEmit', tmpPath], {
      cwd: process.cwd(),
      shell: true,
    });
    tsc.on('close', (code) => {
      fs.unlinkSync(tmpPath);
      resolve(code === 0);
    });
  });
}