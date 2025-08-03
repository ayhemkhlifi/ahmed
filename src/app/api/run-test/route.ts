import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { fileName } = await req.json();
  const testPath = path.join(process.cwd(), '__tests__', `${fileName}.test.ts`);
  if (!fs.existsSync(testPath)) return NextResponse.json({ ok: false, output: 'Test file not found' });

  return new Promise((resolve) => {
    const jest = spawn('npx', ['jest', path.basename(testPath), '--colors'], {
      cwd: process.cwd(),
      shell: true,
    });
    let out = '';
    jest.stdout.on('data', (d) => (out += d));
    jest.stderr.on('data', (d) => (out += d));
    jest.on('close', (c) => resolve(NextResponse.json({ ok: c === 0, output: out })));
  });
}