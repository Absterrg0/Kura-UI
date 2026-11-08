import type { Kanji } from "./kanji";

/** Each shelf of the store has its own seal. */
export const CATEGORY_SEAL: Record<string, Kanji> = {
  primitives: "基",
  input: "入",
  voice: "声",
  conversation: "話",
  agent: "働",
  feedback: "待",
  effects: "効",
};
