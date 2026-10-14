export * from "./types";
export * from "./tools";
export * from "./site";

import { tools } from "./tools";
import { ToolCategory, ToolDefinition } from "./types";

export function getAllTools(): ToolDefinition[] {
  return tools;
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return tools.filter((t) => t.category === category);
}
