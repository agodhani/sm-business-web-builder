const TOKEN_PATTERN = /^\{([a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)+)\}$/;

function getValueAtPath(source: unknown, tokenPath: string): unknown {
  const segments = tokenPath.split(".");
  let current: unknown = source;

  for (const segment of segments) {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function resolveNode(node: unknown, root: unknown, visitedTokens: Set<string>): unknown {
  if (typeof node === "string") {
    const tokenMatch = node.match(TOKEN_PATTERN);
    if (!tokenMatch) {
      return node;
    }

    const tokenPath = tokenMatch[1];
    if (visitedTokens.has(tokenPath)) {
      throw new Error(`Cyclic style token reference detected for "${tokenPath}".`);
    }

    const referencedValue = getValueAtPath(root, tokenPath);
    if (referencedValue === undefined) {
      throw new Error(`Unknown style token reference "${tokenPath}".`);
    }

    const nextVisitedTokens = new Set(visitedTokens);
    nextVisitedTokens.add(tokenPath);
    return resolveNode(referencedValue, root, nextVisitedTokens);
  }

  if (Array.isArray(node)) {
    return node.map((item) => resolveNode(item, root, visitedTokens));
  }

  if (isPlainObject(node)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
      result[key] = resolveNode(value, root, visitedTokens);
    }
    return result;
  }

  return node;
}

export function resolveStyleTokens<T>(style: T): T {
  return resolveNode(style, style, new Set()) as T;
}
