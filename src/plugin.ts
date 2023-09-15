import type { Plugin, ResolvedConfig, UserConfig } from "vite";
import { ISLAND_MODULE_PREFIX } from "./modules.js";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export const islandsPlugin = (): Plugin[] => {
  let resolvedConfig: ResolvedConfig;

  return [
    {
      name: "sveltekit-islands",
      config() {
        return {
          build: {
            rollupOptions: {
              output: {
                manualChunks(id, meta) {
                  if (resolvedConfig.command !== "build") {
                    return;
                  }

                  if (id.startsWith(`\0${ISLAND_MODULE_PREFIX}`)) {
                    const [componentName] = id
                      .slice(ISLAND_MODULE_PREFIX.length + 2)
                      .split(":", 1);

                    return componentName;
                  }
                },
              },
            },
          },
        } satisfies Partial<UserConfig>;
      },
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

        const [_componentName, importPath] = id
          .slice(ISLAND_MODULE_PREFIX.length + 2)
          .split(":");

        const fullImportPath = `/${path.relative(
          resolvedConfig.root,
          importPath,
        )}`;

        // NOTE: `importPath` is purposefully empty in build mode, as it is
        //       only useful for satisfying Vite in serve mode.
        return `
					export { default as Component } from "${fullImportPath}";
					export const importPath = "${
            resolvedConfig.command === "serve" ? fullImportPath : ""
          }";
				`;
      },
    },
    ...viteStaticCopy({
      targets: [
        {
          src: "node_modules/@11ty/is-land/is-land.js",
          dest: "__islands",
        },
      ],
      silent: true,
    }),
  ];
};
