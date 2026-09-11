import { tools as example } from "../tools/example/index.js";

export const TOOL_CATALOG = [
  ...example
];

export const TOOL_NAMES = TOOL_CATALOG.map((entry) => entry.name);
