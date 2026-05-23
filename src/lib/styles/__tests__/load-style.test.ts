import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DESIGN_ROOT } from "../../config";
import { discoverStyleFiles, discoverStyleSummaries } from "../discover-styles";
import { loadStyleFromDesignFile } from "../load-style";

const sampleDesign = `---
version: alpha
name: Test Style
description: Fixture style for parser tests.
colors:
  primary: "#0066cc"
  on-primary: "#ffffff"
typography:
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
rounded:
  md: 12px
spacing:
  md: 16px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
`;

const invalidDesign = `---
version: alpha
name: Invalid
description: Missing required keys
`;

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((tempRoot) => rm(tempRoot, { recursive: true, force: true })));
  tempRoots.length = 0;
});

async function createTempRoot() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "style-loader-test-"));
  tempRoots.push(tempRoot);
  return tempRoot;
}

describe("style discovery and loading", () => {
  it("loads a valid DESIGN.md and resolves component tokens", async () => {
    const root = await createTempRoot();
    const styleDir = path.join(root, "apple");
    await mkdir(styleDir, { recursive: true });
    const filePath = path.join(styleDir, "DESIGN.md");
    await writeFile(filePath, sampleDesign, "utf8");

    const loaded = await loadStyleFromDesignFile(filePath);
    const component = loaded.style.components["button-primary"] as Record<string, unknown>;

    expect(loaded.styleId).toBe("apple");
    expect(loaded.style.name).toBe("Test Style");
    expect(component.backgroundColor).toBe("#0066cc");
    expect(component.textColor).toBe("#ffffff");
    expect(component.rounded).toBe("12px");
    expect(component.typography).toEqual({
      fontFamily: "Inter, sans-serif",
      fontSize: "16px"
    });
  });

  it("discovers style files and summaries from nested directories", async () => {
    const root = await createTempRoot();
    const appleDir = path.join(root, "apple");
    const ferrariDir = path.join(root, "nested", "ferrari");
    await mkdir(appleDir, { recursive: true });
    await mkdir(ferrariDir, { recursive: true });

    await writeFile(path.join(appleDir, "DESIGN.md"), sampleDesign, "utf8");
    await writeFile(
      path.join(ferrariDir, "DESIGN.md"),
      sampleDesign.replace("Test Style", "Ferrari Style"),
      "utf8"
    );

    const files = await discoverStyleFiles(root);
    const summaries = await discoverStyleSummaries(root);

    expect(files).toHaveLength(2);
    expect(summaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ styleId: "apple", name: "Test Style" }),
        expect.objectContaining({ styleId: "ferrari", name: "Ferrari Style" })
      ])
    );
  });

  it("rejects invalid style frontmatter", async () => {
    const root = await createTempRoot();
    const styleDir = path.join(root, "broken");
    await mkdir(styleDir, { recursive: true });
    const filePath = path.join(styleDir, "DESIGN.md");
    await writeFile(filePath, invalidDesign, "utf8");

    await expect(loadStyleFromDesignFile(filePath)).rejects.toThrow(/invalid style/i);
  });

  it("discovers many real styles from the configured design root", async () => {
    const summaries = await discoverStyleSummaries(DESIGN_ROOT);
    expect(summaries.length).toBeGreaterThan(10);
  });
});
