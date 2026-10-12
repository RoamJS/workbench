import format from "date-fns/format";
import setDay from "date-fns/setDay";

export const WEEKLY_NOTE_DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export const WEEKLY_NOTE_FORMAT_DEFAULT =
  "{monday:MM/dd yyyy} - {sunday:MM/dd yyyy}";

export const WEEKLY_NOTE_DATE_REGEX = new RegExp(
  `{(${WEEKLY_NOTE_DAYS.join("|")}):(.*?)}`,
  "g"
);

type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const getWeeklyNoteDayIndex = (day: string): WeekStartsOn => {
  const index = WEEKLY_NOTE_DAYS.findIndex((d) => d === day);
  return (index < 0 ? 0 : index) as WeekStartsOn;
};

const getWeekStartsOn = (weeklyNoteFormat: string): WeekStartsOn =>
  getWeeklyNoteDayIndex(
    weeklyNoteFormat.match(new RegExp(WEEKLY_NOTE_DATE_REGEX.source))?.[1] ||
      "sunday"
  );

export const formatWeeklyNotePageTitle = ({
  date,
  weeklyNoteFormat,
}: {
  date: Date;
  weeklyNoteFormat: string;
}): string => {
  const weekStartsOn = getWeekStartsOn(weeklyNoteFormat);
  return weeklyNoteFormat.replace(
    WEEKLY_NOTE_DATE_REGEX,
    (_, day: string, dayFormat: string) =>
      format(
        setDay(date, getWeeklyNoteDayIndex(day), { weekStartsOn }),
        dayFormat,
        { useAdditionalWeekYearTokens: true }
      )
  );
};

export type ProcessSmartBlocksText = (
  text: string
) => Promise<{ text: string }[]>;

export const resolveWeeklyNotePageTitle = async ({
  expression = "today",
  processBlockText,
  pageTitleToDate,
  weeklyNoteFormat,
}: {
  expression?: string;
  processBlockText: ProcessSmartBlocksText;
  pageTitleToDate: (title: string) => Date | null;
  weeklyNoteFormat: string;
}): Promise<string> => {
  // SmartBlocks can resolve "this week" to Sunday, outside a Monday-based week.
  // "today" preserves its active DATEBASIS while selecting the containing week.
  const dateExpression = /^\s*this\s+week\s*$/i.test(expression)
    ? "today"
    : expression || "today";
  const blocks = await processBlockText(`<%DATE:${dateExpression}%>`);
  const output = blocks[0]?.text?.trim() || "";
  const pageTitle = /^\[\[(.*)\]\]$/.exec(output)?.[1];
  const date = pageTitle ? pageTitleToDate(pageTitle) : null;
  if (!date || Number.isNaN(date.valueOf())) {
    throw new Error(`Could not resolve "${dateExpression}" to a date`);
  }
  return formatWeeklyNotePageTitle({ date, weeklyNoteFormat });
};
