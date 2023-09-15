import type { Plugin, ResolvedConfig } from "vite";

export const islandsPlugin = (): Plugin[] => {
  let resolvedConfig: ResolvedConfig;

  return [
    {
      name: "sveltekit-islands",
      configResolved(config) {
        resolvedConfig = config;
      },
    },
  ];
};
