import { modifySvelteMarkup } from "./helpers/modifySvelteMarkup.js";
import { type PreprocessorGroup } from "svelte/src/compiler/preprocess/public";
import { walkTree } from "./helpers/walkTree.js";
import MagicString from "magic-string";
import {
  Element,
  MustacheTag,
  TemplateNode,
} from "svelte/types/compiler/interfaces";
import crypto from "crypto";
import { ISLAND_MODULE_PREFIX } from "./modules.js";

export const islandsPreprocessor = (): PreprocessorGroup => {
  const filenameToIslandModules: Partial<{ [filename: string]: string[] }> = {};

  return {
    markup({ content, filename }) {
      if (filename == null) {
        return;
      }

      return {
        code: modifySvelteMarkup(content, (strippedContent, ast) => {
          const newContent = new MagicString(strippedContent);

          walkTree(ast.html, (node) => {
            if (!isIslandComponent(node)) {
              return;
            }

            const componentAttribute = node.attributes.find(
              ({ name }) => name === "component",
            );
            if (
              componentAttribute == null ||
              componentAttribute.type !== "Attribute"
            ) {
              return;
            }

            const [componentValue] = componentAttribute.value;
            if (!isMustacheTag(componentValue)) {
              return;
            }

            const componentExpression = componentValue.expression;
            if (componentExpression.type !== "Identifier") {
              return;
            }

            const componentName = componentExpression.name;

            const islandId = buildIslandId(filename, node);
            const virtualModuleName = `${ISLAND_MODULE_PREFIX}${componentName}`;
            const script = `/${virtualModuleName}`;

            filenameToIslandModules[filename] ??= [];
            filenameToIslandModules[filename]!.push(virtualModuleName);

            newContent.appendRight(
              componentAttribute.end,
              ` islandId="${islandId}" script="${script}"`,
            );
          });

          return newContent.toString();
        }),
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

      console.log(filename, islandModules);
    },
  };
};

const isIslandComponent = (node: TemplateNode): node is Element =>
  node.type === "InlineComponent" && node.name === "Island";

const isMustacheTag = (value: unknown): value is MustacheTag =>
  typeof value === "object" &&
  value != null &&
  "type" in value &&
  value.type === "MustacheTag";

const buildIslandId = (filename: string, node: Element) =>
  crypto.createHash("sha256").update(`${filename}:${node.start}`).digest("hex");
