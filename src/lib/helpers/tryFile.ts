import fs from 'fs/promises';

export const tryFile = async (...paths: string[]): Promise<string | null> => {
	for (const path of paths) {
		const exists = await fs.lstat(path).catch(() => false);
		if (!!exists) {
			return path;
		}
	}

	return null;
};
