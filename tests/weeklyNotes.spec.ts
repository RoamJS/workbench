import { expect, test } from "@playwright/test";
import dateFnsFormat from "date-fns/format";
import {
  formatWeeklyNoteTitle,
  resolveSmartBlocksDate,
} from "../src/utils/weeklyNotes";

const formatDate = (date: Date, format: string): string =>
  dateFnsFormat(date, format, { useAdditionalWeekYearTokens: true });

test("formats the configured Monday-to-Sunday week containing a date", () => {
  expect(
    formatWeeklyNoteTitle({
      date: new Date(2026, 6, 30, 12),
      format: "{monday:MM/dd yyyy} - {sunday:MM/dd yyyy}",
      formatDate,
    })
  ).toBe("07/27 2026 - 08/02 2026");
});

test("uses the first placeholder as the configured start of the week", () => {
  expect(
    formatWeeklyNoteTitle({
      date: new Date(2026, 7, 7, 12),
      format: "Week {wednesday:yyyy-MM-dd} to {tuesday:yyyy-MM-dd}",
      formatDate,
    })
  ).toBe("Week 2026-08-05 to 2026-08-11");
});

test("formats weeks across year boundaries", () => {
  expect(
    formatWeeklyNoteTitle({
      date: new Date(2026, 11, 31, 12),
      format: "{sunday:MM/dd yyyy} - {saturday:MM/dd yyyy}",
      formatDate,
    })
  ).toBe("12/27 2026 - 01/02 2027");
});

test("returns null when a configured placeholder cannot be formatted", () => {
  expect(
    formatWeeklyNoteTitle({
      date: new Date(2026, 6, 30, 12),
      format: "{monday:invalid}",
      formatDate: () => null,
    })
  ).toBeNull();
});

test("resolves dates through the SmartBlocks DATE command", async () => {
  const expected = new Date(2026, 6, 30, 12);
  let processed = "";
  const result = await resolveSmartBlocksDate({
    expression: "In one week",
    processBlockText: async (text) => {
      processed = text;
      return [{ text: "[[July 30th, 2026]]" }];
    },
    pageTitleToDate: (title) => (title === "July 30th, 2026" ? expected : null),
  });

  expect(processed).toBe("<%DATE:In one week%>");
  expect(result).toBe(expected);
});

test("rejects output that SmartBlocks did not resolve to a date", async () => {
  await expect(
    resolveSmartBlocksDate({
      expression: "not a date",
      processBlockText: async () => [{ text: "Could not resolve date" }],
      pageTitleToDate: () => null,
    })
  ).rejects.toThrow('Could not resolve "not a date" to a date');
});
