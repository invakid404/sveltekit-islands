import fs from 'fs/promises';
import path from 'path';

export async function* walkDir(dir: string): AsyncGenerator<string> {
	for await (const dirEntry of await fs.opendir(dir)) {
		const entry = path.join(dir, dirEntry.name);

		if (dirEntry.isDirectory()) {
			yield* walkDir(entry);
		} else if (dirEntry.isFile()) {
			yield entry;
		}
	}
}
