import fs from 'fs/promises';
import { execSync } from 'child_process';

await fs.copyFile('package.json', 'dist/package.json');
await fs.copyFile('README.md', 'dist/README.md');

execSync('pnpm publish', {
	cwd: 'dist'
});
