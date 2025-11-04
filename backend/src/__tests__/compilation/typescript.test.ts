import { execSync } from 'child_process';
import path from 'path';

/**
 * TypeScript Compilation Test
 * This test ensures the project builds successfully
 * Catches the type errors that caused Railway deployment to fail
 */

describe('TypeScript Compilation', () => {
  it('should compile without errors', () => {
    const projectRoot = path.join(__dirname, '../../..');

    try {
      // Run TypeScript compiler
      const output = execSync('npm run build', {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // If we get here, compilation succeeded
      expect(output).toBeDefined();
    } catch (error: any) {
      // If compilation fails, show the error
      console.error('TypeScript compilation failed:');
      console.error(error.stdout);
      console.error(error.stderr);
      throw new Error(`TypeScript compilation failed: ${error.message}`);
    }
  }, 30000); // 30 second timeout for build

  it('should have no type errors in production config', () => {
    const projectRoot = path.join(__dirname, '../../..');

    try {
      execSync('npx tsc --project tsconfig.build.json --noEmit', {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    } catch (error: any) {
      console.error('Type checking failed:');
      console.error(error.stdout);
      throw new Error('Type checking failed');
    }
  }, 30000);
});
