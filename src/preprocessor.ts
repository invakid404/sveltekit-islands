import { modifySvelteMarkup } from "./helpers/modifySvelteMarkup.js";
import { type PreprocessorGroup } from "svelte/src/compiler/preprocess/public";
import { walkTree } from "./helpers/walkTree";

export const islandsPreprocessor = (): PreprocessorGroup => {
  return {
    markup({ content, filename }) {
      return {
        code: modifySvelteMarkup(content, (strippedContent, ast) => {
          walkTree(ast.html, (node) => {
            if (node.type !== "InlineComponent" || node.name !== "Island") {
              return;
            }

            console.log(node);
          });

          return strippedContent;
        }),
      };
    },
    script() {},
  };
};
