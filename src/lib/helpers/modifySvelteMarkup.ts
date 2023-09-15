import crypto from 'crypto';
import * as svelte from 'svelte/compiler';
import type { Ast } from 'svelte/types/compiler/interfaces';

const nonMarkupTagPattern = /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g;

// Svelte markup contains `<script></script>` and `<style></style>` tags,
// which cannot be directly parsed by `svelte.parse()`, so we must temporarily
// remove them, modify the actual markup, then insert them in their original
// place when we're done.
export const modifySvelteMarkup = (
	content: string,
	callback: (strippedContent: string, ast: Ast) => string | undefined
): string => {
	const replacements: Array<[string, string]> = [];

	const strippedContent = content.replace(nonMarkupTagPattern, (match) => {
		const placeholder = `<!--${crypto.randomUUID()}-->`;
		replacements.push([placeholder, match]);

		return placeholder;
	});

	const ast = svelte.parse(strippedContent);

	const newContent = callback(strippedContent, ast) ?? strippedContent;

	return replacements.reduce(
		(acc, [placeholder, content]) => acc.replace(placeholder, content),
		newContent
	);
};
