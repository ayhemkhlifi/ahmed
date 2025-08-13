import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function syntaxOK(code: string, fnName?: string): Promise<boolean> {
  // Create a temporary test file in the actual __tests__ directory
  // so it has the correct relative path context
  const testDir = path.join(process.cwd(), '__tests__');
  fs.mkdirSync(testDir, { recursive: true });
  
  const tmpPath = path.join(testDir, `_syntax_check_${fnName || 'temp'}.ts`);
  
  try {
    fs.writeFileSync(tmpPath, code);
    console.log(`🔍 Checking syntax at: ${tmpPath}`);

    return new Promise((resolve) => {
      // Use TypeScript compiler to check syntax with proper module resolution
      const tsc = spawn('npx', [
        'tsc', 
        '--noEmit', 
        '--skipLibCheck',
        '--moduleResolution', 'node',
        '--esModuleInterop',
        '--allowSyntheticDefaultImports',
        tmpPath
      ], {
        cwd: process.cwd(),
        shell: true,
        stdio: 'pipe'
      });
      
      let output = '';
      
      tsc.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      tsc.stderr?.on('data', (data) => {
        output += data.toString();
      });

      tsc.on('close', (code) => {
        // Clean up temporary file
        try {
          if (fs.existsSync(tmpPath)) {
            fs.unlinkSync(tmpPath);
          }
        } catch (cleanupError) {
          console.warn('Could not cleanup syntax check file:', cleanupError);
        }
        
        if (code !== 0) {
          console.log('❌ Syntax check failed:', output);
        } else {
          console.log('✅ Syntax check passed');
        }
        
        resolve(code === 0);
      });
      
      tsc.on('error', (error) => {
        console.error('Syntax check process error:', error);
        try {
          if (fs.existsSync(tmpPath)) {
            fs.unlinkSync(tmpPath);
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        resolve(false);
      });
    });
  } catch (error) {
    console.error('Syntax check setup error:', error);
    return false;
  }
}