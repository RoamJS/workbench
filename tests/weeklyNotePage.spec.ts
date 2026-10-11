import { expect, test } from "@playwright/test";
import format from "date-fns/format";
import parseNlpDate from "roamjs-components/date/parseNlpDate";
import {
  formatWeeklyNotePageTitle,
  resolveWeeklyNotePageTitle,
  WEEKLY_NOTE_FORMAT_DEFAULT,
} from "../src/utils/weeklyNotePage";

const basis = new Date(2026, 6, 23, 12);

// Exercise the installed NLP parser as well as the weekly formatter. The live
// Roam test separately exercises SmartBlocks' command context and DATEBASIS.
const resolveWithParser = ({
  expression,
  dateBasis = basis,
  weeklyNoteFormat = WEEKLY_NOTE_FORMAT_DEFAULT,
}: {
  expression?: string;
  dateBasis?: Date;
  weeklyNoteFormat?: string;
}): Promise<string> =>
  resolveWeeklyNotePageTitle({
    expression,
    weeklyNoteFormat,
    processBlockText: async (command) => {
      const argument = /^<%DATE:(.*)%>$/.exec(command)?.[1];
      expect(argument).toBeDefined();
      return [
        {
          text: `[[${format(
            parseNlpDate(argument!, dateBasis),
            "yyyy-MM-dd"
          )}]]`,
        },
      ];
    },
    pageTitleToDate: (title) => {
      const [year, month, day] = title.split("-").map(Number);
      return new Date(year, month - 1, day, 12);
    },
  });

for (const [expression, expected] of [
  ["This week", "07/20 2026 - 07/26 2026"],
  ["Next week", "07/27 2026 - 08/02 2026"],
  ["Last week", "07/13 2026 - 07/19 2026"],
  ["In one week", "07/27 2026 - 08/02 2026"],
  ["In three weeks", "08/10 2026 - 08/16 2026"],
  ["Six weeks ago", "06/08 2026 - 06/14 2026"],
  ["In one day", "07/20 2026 - 07/26 2026"],
  ["  THIS week  ", "07/20 2026 - 07/26 2026"],
  ["", "07/20 2026 - 07/26 2026"],
]) {
  test(`resolves ${JSON.stringify(
    expression
  )} using the real NLP parser`, async () => {
    expect(await resolveWithParser({ expression })).toBe(expected);
  });
}

test("defaults to the active date basis", async () => {
  expect(await resolveWithParser({})).toBe("07/20 2026 - 07/26 2026");
});

test("this week follows a different basis instead of the wall clock", async () => {
  expect(
    await resolveWithParser({
      expression: "This week",
      dateBasis: new Date(2030, 0, 1, 12),
    })
  ).toBe("12/31 2029 - 01/06 2030");
});

for (const [day, expected] of [
  [19, "07/13 2026 - 07/19 2026"],
  [20, "07/20 2026 - 07/26 2026"],
  [26, "07/20 2026 - 07/26 2026"],
  [27, "07/27 2026 - 08/02 2026"],
] as const) {
  test(`keeps July ${day} in its Monday-to-Sunday week`, async () => {
    expect(
      await resolveWithParser({
        expression: "This week",
        dateBasis: new Date(2026, 6, day, 12),
      })
    ).toBe(expected);
  });
}

test("supports a Sunday-to-Saturday week across the year boundary", async () => {
  expect(
    await resolveWithParser({
      expression: "today",
      dateBasis: new Date(2026, 11, 31, 12),
      weeklyNoteFormat: "{sunday:MM/dd yyyy} - {saturday:MM/dd yyyy}",
    })
  ).toBe("12/27 2026 - 01/02 2027");
});

test("uses the first configured placeholder for custom weekly boundaries", async () => {
  expect(
    await resolveWithParser({
      expression: "This week",
      weeklyNoteFormat: "Week {wednesday:yyyy-MM-dd} to {tuesday:yyyy-MM-dd}",
    })
  ).toBe("Week 2026-07-22 to 2026-07-28");
});

test("delegates general expressions unchanged to the active SmartBlocks processor", async () => {
  let command = "";
  expect(
    await resolveWeeklyNotePageTitle({
      expression: "Six weeks ago",
      weeklyNoteFormat: WEEKLY_NOTE_FORMAT_DEFAULT,
      processBlockText: async (text) => {
        command = text;
        return [{ text: "[[June 11th, 2026]]" }];
      },
      pageTitleToDate: (title) =>
        title === "June 11th, 2026" ? new Date(2026, 5, 11, 12) : null,
    })
  ).toBe("06/08 2026 - 06/14 2026");
  expect(command).toBe("<%DATE:Six weeks ago%>");
});

for (const output of [
  [],
  [{ text: "DATE failed" }],
  [{ text: "[[invalid]]" }],
]) {
  test(`rejects unresolved SmartBlocks output ${JSON.stringify(
    output
  )}`, async () => {
    await expect(
      resolveWeeklyNotePageTitle({
        expression: "bad input",
        weeklyNoteFormat: WEEKLY_NOTE_FORMAT_DEFAULT,
        processBlockText: async () => output,
        pageTitleToDate: () => new Date(NaN),
      })
    ).rejects.toThrow('Could not resolve "bad input" to a date');
  });
}

test("reports invalid weekly format tokens", () => {
  expect(() =>
    formatWeeklyNotePageTitle({
      date: basis,
      weeklyNoteFormat: "{monday:invalid}",
    })
  ).toThrow();
});
