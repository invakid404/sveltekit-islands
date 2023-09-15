export const ISLAND_MODULE_PREFIX = "island";

export const ISLAND_MODULE_PATTERN = new RegExp(
  `"/${ISLAND_MODULE_PREFIX}:(\\S+?):"`,
  "g",
);
