import fs from 'fs';
import path from 'path';

export async function writeSourceFile(sourceCode: string, fnName: string): Promise<string> {
  const srcDir = path.join(process.cwd(), 'src', 'generated-functions');
  fs.mkdirSync(srcDir, { recursive: true });
  
  // Ensure the function is properly exported
  let exportedCode = sourceCode.trim();
  
  // Check if it already has export
  if (!exportedCode.includes('export')) {
    // Add export to function declarations
    exportedCode = exportedCode.replace(
      /^(function|const|let|var)\s+/m, 
      'export $1 '
    );
  }
  
  // If it starts with 'export ' but not 'export function/const/etc', fix it
  if (exportedCode.startsWith('export ') && !exportedCode.match(/^export\s+(function|const|let|var)/)) {
    exportedCode = exportedCode.replace(/^export\s+/, 'export function ');
  }
  
  const sourcePath = path.join(srcDir, `${fnName}.ts`);
  fs.writeFileSync(sourcePath, exportedCode);
  console.log('📄 Created source file:', sourcePath);
  return sourcePath;
}

// Cleanup function to remove generated files after testing
export function cleanupSourceFile(fnName: string): void {
  try {
    const sourcePath = path.join(process.cwd(), 'src', 'generated-functions', `${fnName}.ts`);
    if (fs.existsSync(sourcePath)) {
      fs.unlinkSync(sourcePath);
      console.log('🗑️ Cleaned up source file:', sourcePath);
    }
  } catch (error) {
    console.warn('Could not cleanup source file:', error);
  }
}