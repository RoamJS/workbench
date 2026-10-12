import { pinyin } from "pinyin-pro";

const lowercaseCharIsAlpha = (char: string) => {
  const code = char.charCodeAt(0);
  return code > 96 && code < 123;
};

const normalizeLetters = (text: string) =>
  Array.from(text)
    .map((char) => char.toLowerCase())
    .filter(lowercaseCharIsAlpha)
    .join("");

const getPinyin = (text: string) =>
  pinyin(text, { toneType: "none", type: "array" });

const CONTAINS_HAN_CHARACTER = /\p{Script=Han}/u;

export const preprocessItemText = (text: string) =>
  normalizeLetters(getPinyin(text).join(""));

export const getItemAlternativeTexts = (text: string) =>
  CONTAINS_HAN_CHARACTER.test(text) ? [preprocessItemText(text)] : [];

export const getItemInitials = (text: string) => {
  const characters = Array.from(text);
  const transliterations = getPinyin(text);

  return characters
    .map((char, index) => {
      const lowerChar = char.toLowerCase();
      if (
        lowercaseCharIsAlpha(lowerChar) &&
        (index === 0 || characters[index - 1] === " " || lowerChar !== char)
      ) {
        return lowerChar;
      }

      const transliteration = normalizeLetters(transliterations[index] || "");
      return transliteration !== lowerChar ? transliteration.charAt(0) : "";
    })
    .join("");
};

export const hasMatchingKeyPrefix = (keys: string[], prefix: string) =>
  keys.some((key) => key.startsWith(prefix));
