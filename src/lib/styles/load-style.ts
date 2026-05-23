import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { DESIGN_ROOT } from "../config";
import { type StyleDefinition } from "../types/style";
import { styleSchema } from "../validation/style-schema";
import { resolveStyleTokens } from "./resolve-style-tokens";

const FRONTMATTER_PATTERN = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;

export type LoadedStyle = {
  styleId: string;
  path: string;
  style: StyleDefinition;
};

function extractFrontmatter(markdown: string): string {
  if (!markdown.startsWith("---")) {
    throw new Error("Could not find YAML frontmatter in DESIGN.md.");
  }

  const match = markdown.match(FRONTMATTER_PATTERN);
  if (match) {
    return match[1];
  }

  const firstLineBreak = markdown.indexOf("\n");
  if (firstLineBreak === -1) {
    throw new Error("Could not find YAML frontmatter in DESIGN.md.");
  }

  return markdown.slice(firstLineBreak + 1);
}

function sanitizeYamlFrontmatter(rawFrontmatter: string): string {
  return rawFrontmatter
    .split(/\r?\n/)
    .map((line) => {
      if (!line.startsWith("description:")) {
        return line;
      }

      const value = line.slice("description:".length).trim();
      if (!value || value.startsWith('"') || value.startsWith("'") || value.startsWith("|") || value.startsWith(">")) {
        return line;
      }

      return `description: ${JSON.stringify(value)}`;
    })
    .join("\n");
}

function parseStyleFrontmatter(rawFrontmatter: string): StyleDefinition {
  const parsed = parseYaml(sanitizeYamlFrontmatter(rawFrontmatter));
  const result = styleSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(`Invalid style frontmatter: ${result.error.issues[0]?.message ?? "unknown error"}`);
  }

  return resolveStyleTokens(result.data) as StyleDefinition;
}

export async function loadStyleFromDesignFile(filePath: string): Promise<LoadedStyle> {
  const markdown = await readFile(filePath, "utf8");
  const frontmatter = extractFrontmatter(markdown);
  const style = parseStyleFrontmatter(frontmatter);
  const styleId = path.basename(path.dirname(filePath));

  return {
    styleId,
    path: filePath,
    style
  };
}

export async function loadStyleById(
  styleId: string,
  designRoot: string = DESIGN_ROOT
): Promise<LoadedStyle> {
  const filePath = path.join(designRoot, styleId, "DESIGN.md");
  return loadStyleFromDesignFile(filePath);
}
