import { modifySvelteMarkup } from "./helpers/modifySvelteMarkup.js";
import { type PreprocessorGroup } from "svelte/src/compiler/preprocess/public";
import { walkTree } from "./helpers/walkTree.js";
import MagicString from "magic-string";
import {
  Element,
  MustacheTag,
  TemplateNode,
} from "svelte/types/compiler/interfaces";

export const islandsPreprocessor = (): PreprocessorGroup => {
  return {
    markup({ content, filename }) {
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
            console.log(
              node,
              componentName,
            );
          });

          return newContent.toString();
        }),
      };
    },
    script() {},
  };
};

const isIslandComponent = (node: TemplateNode): node is Element =>
  node.type === "InlineComponent" && node.name === "Island";

const isMustacheTag = (value: unknown): value is MustacheTag =>
  typeof value === "object" &&
  value != null &&
  "type" in value &&
  value.type === "MustacheTag";
