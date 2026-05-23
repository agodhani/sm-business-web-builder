export type StylePrimitive = string | number;

export type StyleValue =
  | StylePrimitive
  | {
      [key: string]: StyleValue;
    };

export type StyleDefinition = {
  version: string;
  name: string;
  description: string;
  colors: Record<string, string>;
  typography: Record<string, Record<string, string | number>>;
  rounded: Record<string, string | number>;
  spacing: Record<string, string | number>;
  components: Record<string, Record<string, StyleValue>>;
};
