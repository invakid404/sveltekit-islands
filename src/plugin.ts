import type { Plugin, ResolvedConfig } from "vite";
import { ISLAND_MODULE_PREFIX } from "./modules.js";

export const islandsPlugin = (): Plugin[] => {
  let resolvedConfig: ResolvedConfig;

  return [
    {
      name: "sveltekit-islands",
      configResolved(config) {
        resolvedConfig = config;
      },
      async resolveId(id, importer) {
        const actualId = id.startsWith("/") ? id.slice("/".length) : id;

        if (!actualId.startsWith(`${ISLAND_MODULE_PREFIX}`)) {
          return;
        }

        const [componentName, importPath] = id
          .slice(ISLAND_MODULE_PREFIX.length + 1)
          .split(":");

        const resolvedImportPath = (await this.resolve(importPath, importer))
          ?.id;
        if (resolvedImportPath == null) {
          return;
        }

        return `\0${ISLAND_MODULE_PREFIX}:${componentName}:${resolvedImportPath}`;
      },
      load(id) {
        if (!id.startsWith(`\0${ISLAND_MODULE_PREFIX}`)) {
          return;
        }

        return "";
      },
    },
  ];
};
