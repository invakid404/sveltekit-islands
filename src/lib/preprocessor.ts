import { modifySvelteMarkup } from './helpers/modifySvelteMarkup.js';
import type { PreprocessorGroup } from 'svelte/types/compiler/preprocess';
import { walkTree } from './helpers/walkTree.js';
import MagicString from 'magic-string';
import type { Element, MustacheTag, TemplateNode } from 'svelte/types/compiler/interfaces';
import crypto from 'crypto';
import { ISLAND_MODULE_PREFIX } from './modules.js';
import * as acorn from 'acorn';
import { walk } from 'estree-walker';
import type { ImportDefaultSpecifier } from 'estree';

export const islandsPreprocessor = (): PreprocessorGroup => {
	const filenameToIslandModules: Partial<{ [filename: string]: string[] }> = {};

	return {
		markup({ content, filename }) {
			if (filename == null) {
				return;
			}

			filenameToIslandModules[filename] = [];

			return {
				code: modifySvelteMarkup(content, (strippedContent, ast) => {
					const newContent = new MagicString(strippedContent);

					walkTree(ast.html, (node) => {
						if (!isIslandComponent(node)) {
							return;
						}

						const componentAttribute = node.attributes.find(({ name }) => name === 'component');
						if (componentAttribute == null || componentAttribute.type !== 'Attribute') {
							return;
						}

						const [componentValue] = componentAttribute.value;
						if (!isMustacheTag(componentValue)) {
							return;
						}

						const componentExpression = componentValue.expression;
						if (componentExpression.type !== 'Identifier') {
							return;
						}

						const componentName = componentExpression.name;

						const islandId = buildIslandId(filename, node);
						const virtualModuleName = `${ISLAND_MODULE_PREFIX}:${componentName}`;
						const script = `/${virtualModuleName}:{${componentName}ImportPath}`;

						filenameToIslandModules[filename]!.push(virtualModuleName);

						newContent.appendRight(
							componentAttribute.end,
							` islandId="${islandId}" script="${script}"`
						);
					});

					return newContent.toString();
				})
			};
		},
		script({ content, filename }) {
			if (filename == null) {
				return;
			}

			const islandModules = filenameToIslandModules[filename];
			if (!islandModules?.length) {
				return;
			}

			const newContent = new MagicString(content);

			const node = acorn.parse(content, {
				ecmaVersion: 'latest',
				sourceType: 'module'
			});

			const components = new Set(
				islandModules.map((module) => module.slice(ISLAND_MODULE_PREFIX.length + 1))
			);
			const componentImportLocations: Partial<{ [component: string]: string }> = {};

			// Find imports for all components used in islands
			walk(node as never, {
				enter(node) {
					if (node.type !== 'ImportDeclaration' || node.source.type !== 'Literal') {
						return;
					}

					const defaultImport = node.specifiers.find(
						(specifier): specifier is ImportDefaultSpecifier =>
							specifier.type === 'ImportDefaultSpecifier'
					);
					if (defaultImport == null || defaultImport.local.type !== 'Identifier') {
						return;
					}

					const importName = defaultImport.local.name;
					if (!components.has(importName)) {
						return;
					}

					componentImportLocations[importName] = String(node.source.value);
				}
			});

			islandModules.forEach((module) => {
				const componentName = module.slice(ISLAND_MODULE_PREFIX.length + 1);
				const componentImport = componentImportLocations[componentName];
				if (componentImport == null) {
					return;
				}

				newContent.prepend(
					`import { component as _${componentName}_tmp, importPath as ${componentName}ImportPath } from "${module}:${componentImport}"; const _${componentName} = _${componentName}_tmp.__island;`
				);
			});

			return { code: newContent.toString() };
		}
	};
};

const isIslandComponent = (node: TemplateNode): node is Element =>
	node.type === 'InlineComponent' && node.name === 'Island';

const isMustacheTag = (value: unknown): value is MustacheTag =>
	typeof value === 'object' && value != null && 'type' in value && value.type === 'MustacheTag';

const buildIslandId = (filename: string, node: Element) =>
	crypto.createHash('sha256').update(`${filename}:${node.start}`).digest('hex');
