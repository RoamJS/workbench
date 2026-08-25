import assert from "node:assert/strict";
import test from "node:test";
import {
  getItemAlternativeTexts,
  getItemInitials,
  preprocessItemText,
} from "./deepnavKeys";

test("keeps existing Latin prefix and initial behavior", () => {
  assert.equal(preprocessItemText("Project Alpha"), "projectalpha");
  assert.equal(getItemInitials("Project Alpha"), "pa");
  assert.equal(getItemInitials("camelCase Page"), "ccp");
});

test("creates full pinyin and abbreviation keys for Chinese page titles", () => {
  assert.equal(preprocessItemText("中文页面"), "zhongwenyemian");
  assert.equal(getItemInitials("中文页面"), "zwym");
  assert.deepEqual(getItemAlternativeTexts("中文页面"), ["zhongwenyemian"]);
});

test("creates keys from mixed Chinese alias text", () => {
  assert.equal(preprocessItemText("中文 Alias"), "zhongwenalias");
  assert.equal(getItemInitials("中文 Alias"), "zwa");
});

test("does not add alternative keys for Latin-only text", () => {
  assert.deepEqual(getItemAlternativeTexts("Project Alpha"), []);
});
