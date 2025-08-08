import fs from 'fs';
import path from 'path';

export async function writeTestFile(testCode: string, fnName: string): Promise<string> {
  const testDir = path.join(process.cwd(), '__tests__');
  fs.mkdirSync(testDir, { recursive: true });
  const testPath = path.join(testDir, `${fnName}.test.ts`);
  fs.writeFileSync(testPath, testCode);
  console.log('📄 created', testPath);
  return testPath;
}