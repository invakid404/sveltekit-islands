import path from 'path';
import fs from 'fs/promises';
import { tryFile } from '$lib/helpers/tryFile.js';
import { PROJECT_ROOT } from '$lib/helpers/projectRoot.js';

export const findNodeModule = async (root: string, name: string) => {
	const file = await tryFile(
		...[root, PROJECT_ROOT, path.join(root, '.pnpm')].map((file) =>
			path.join(file, 'node_modules', name)
		)
	);

	if (file == null) {
		throw new Error(`Failed to find "${name}" in node_modules!`);
	}

	return fs.realpath(file);
};
