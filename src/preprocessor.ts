import type { PreprocessorGroup } from "svelte/src/compiler/preprocess/public";

export const islandsPreprocessor = (): PreprocessorGroup => {
  return {
    markup() {},
    script() {},
  };
};
