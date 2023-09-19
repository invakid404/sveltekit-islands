import fs from 'fs/promises';
import { execSync } from 'child_process';

await fs.copyFile('package.json', 'dist/package.json');
execSync('yarn publish', {
	cwd: 'dist'
});
