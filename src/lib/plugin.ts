import type { Plugin, ResolvedConfig, UserConfig } from 'vite';
import { ISLAND_MODULE_PATTERN, ISLAND_MODULE_PREFIX, SVELTE_CHUNK } from './modules.js';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { isNotNullish } from './helpers/isNotNullish.js';
import path from 'path';
import fs from 'fs/promises';
import { walkDir } from './helpers/walkDir.js';

export const islandsPlugin = (): Plugin[] => {
	let resolvedConfig: ResolvedConfig;

	return [
		{
			name: 'sveltekit-islands',
			config() {
				return {
					build: {
						rollupOptions: {
							output: {
								manualChunks(id, meta) {
									if (resolvedConfig.command !== 'build') {
										return;
									}

									const svelte = path.join(resolvedConfig.root, 'node_modules', 'svelte');
									if (id.startsWith(svelte)) {
										return 'svelte';
									}

									if (id.startsWith(`\0${ISLAND_MODULE_PREFIX}`)) {
										const [componentName] = id.slice(ISLAND_MODULE_PREFIX.length + 2).split(':', 1);

										return componentName;
									}
								}
							}
						}
					}
				} satisfies Partial<UserConfig>;
			},
			configResolved(config) {
				resolvedConfig = config;
			},
			async resolveId(id, importer) {
				const actualId = id.startsWith('/') ? id.slice('/'.length) : id;
				if (!actualId.startsWith(`${ISLAND_MODULE_PREFIX}`)) {
					return;
				}

				const [componentName, importPath] = actualId
					.slice(ISLAND_MODULE_PREFIX.length + 1)
					.split(':');

				const resolvedImportPath = (await this.resolve(importPath, importer))?.id;
				if (resolvedImportPath == null) {
					return;
				}

				return `\0${ISLAND_MODULE_PREFIX}:${componentName}:${resolvedImportPath}`;
			},
			load(id) {
				// HACK: in dev mode, there's nothing to replace the svelte chunk
				//       magic string, so Vite will try to resolve it. Return an
				//       empty string for it so that it stops looking.
				if (id === `/${SVELTE_CHUNK}`) {
					return '';
				}

				if (!id.startsWith(`\0${ISLAND_MODULE_PREFIX}`)) {
					return;
				}

				const [_componentName, importPath] = id.slice(ISLAND_MODULE_PREFIX.length + 2).split(':');

				const fullImportPath = `/${path.relative(resolvedConfig.root, importPath)}`;

				// NOTE: `importPath` is purposefully empty in build mode, as it is
				//       only useful for satisfying Vite in serve mode.
				return `
					export { default as Component } from "${fullImportPath}";
					export const importPath = "${resolvedConfig.command === 'serve' ? fullImportPath : ''}";
				`;
			},
			async generateBundle(options, bundle) {
				const bundleEntries = Object.entries(bundle);

				const target = path.basename(options.dir!);
				const svelteChunk =
					target === 'server'
						? SVELTE_CHUNK
						: bundleEntries.find(([filename]) => path.basename(filename).startsWith('svelte'))?.[0];

				if (svelteChunk == null) {
					throw new Error('Failed to find Svelte chunk');
				}

				const componentNameToChunk = {
					...Object.fromEntries(
						bundleEntries
							.map(([filename, node]) => {
								if (node.type !== 'chunk') {
									return;
								}

								const islandModule = node.moduleIds.find((moduleId) =>
									moduleId.startsWith(`\0${ISLAND_MODULE_PREFIX}`)
								);
								if (islandModule == null) {
									return;
								}

								const [componentName] = islandModule
									.slice(ISLAND_MODULE_PREFIX.length + 2)
									.split(':', 1);

								return [componentName, filename];
							})
							.filter(isNotNullish)
					),
					_svelte: svelteChunk
				};

				for (const [_name, node] of bundleEntries) {
					if (node.type !== 'chunk') {
						continue;
					}

					node.code = node.code.replaceAll(
						ISLAND_MODULE_PATTERN,
						(_match, componentName) => `"/${componentNameToChunk[componentName]}"`
					);
				}

				// Store information about bundle so that we can retrieve it after
				// pre-rendering is complete, as we'll need it to replace island
				// module references with chunks in the HTML as well.
				await fs.mkdir(resolvedConfig.cacheDir, { recursive: true });
				await fs.writeFile(
					path.join(resolvedConfig.cacheDir, `islands_${target}.json`),
					JSON.stringify(componentNameToChunk)
				);
			},
			writeBundle: {
				sequential: true,
				async handler(options) {
					if (!options.dir?.endsWith('/server')) {
						return;
					}

					const [clientChunks, serverChunks] = await Promise.all(
						['client', 'server'].map(
							async (target) =>
								JSON.parse(
									await fs.readFile(
										path.join(resolvedConfig.cacheDir, `islands_${target}.json`),
										'utf-8'
									)
								) as { [component: string]: string }
						)
					);

					const serverToClientChunk = Object.entries(serverChunks).reduce(
						(acc, [component, serverChunk]) => {
							acc[serverChunk] = clientChunks[component];

							return acc;
						},
						{} as Record<string, string>
					);

					const prerenderedPath = path.resolve(options.dir, '../prerendered');
					for await (const entry of walkDir(prerenderedPath)) {
						if (!entry.endsWith('.html')) {
							continue;
						}

						const content = await fs.readFile(entry, 'utf-8');
						const newContent = Object.entries(serverToClientChunk).reduce(
							(acc, [serverChunk, clientChunk]) => {
								return acc.replace(serverChunk, clientChunk);
							},
							content
						);

						if (content === newContent) {
							continue;
						}

						await fs.writeFile(entry, newContent, 'utf-8');
					}
				}
			}
		},
		...viteStaticCopy({
			targets: [
				{
					src: 'node_modules/@11ty/is-land/is-land.js',
					dest: '__islands'
				}
			],
			silent: true
		})
	];
};
