import fs from 'fs';
import path from 'path';

export async function writeTestFile(testCode: string, fnName: string): Promise<string> {
  console.log('🛠 Starting writeTestFile...');
  console.log('📌 Received function name:', fnName);
  console.log('📝 Length of test code:', testCode.length, 'characters');

  try {
    // 1️⃣ Define the directory where tests will be stored
    const testDir = path.join(process.cwd(), 'src/__tests__');
    console.log('📂 Test directory path:', testDir);

    // 2️⃣ Create the directory if it doesn't exist
    fs.mkdirSync(testDir, { recursive: true });
    console.log('✅ Directory ensured/created successfully.');

    // 3️⃣ Define the full file path
    const testPath = path.join(testDir, `${fnName}.test.ts`);
    console.log('📄 Full test file path:', testPath);

    // 4️⃣ Write the file
    fs.writeFileSync(testPath, testCode, { encoding: 'utf-8' });
    console.log('✅ Test file written successfully!');

    return testPath;
  } catch (error) {
    console.error('❌ Error while writing test file:', error);
    throw error; // rethrow so the caller knows something went wrong
  }
}
