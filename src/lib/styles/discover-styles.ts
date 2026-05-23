import { readdir } from "node:fs/promises";
import path from "node:path";
import { DESIGN_ROOT } from "../config";
import { loadStyleFromDesignFile } from "./load-style";

export type StyleSummary = {
  styleId: string;
  name: string;
  description: string;
  path: string;
};

async function walkDesignRoot(rootDir: string): Promise<string[]> {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkDesignRoot(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name === "DESIGN.md") {
      results.push(fullPath);
    }
  }

  return results;
}

export async function discoverStyleFiles(designRoot: string = DESIGN_ROOT): Promise<string[]> {
  const files = await walkDesignRoot(designRoot);
  files.sort((a, b) => a.localeCompare(b));
  return files;
}

export async function discoverStyleSummaries(designRoot: string = DESIGN_ROOT): Promise<StyleSummary[]> {
  const files = await discoverStyleFiles(designRoot);
  const loaded = await Promise.all(
    files.map(async (filePath) => {
      try {
        return await loadStyleFromDesignFile(filePath);
      } catch {
        return null;
      }
    })
  );

  return loaded
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .map((item) => ({
      styleId: item.styleId,
      name: item.style.name,
      description: item.style.description,
      path: item.path
    }))
    .sort((a, b) => a.styleId.localeCompare(b.styleId));
}
