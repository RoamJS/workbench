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

const WEEKLY_NOTE_DATE_REGEX_SOURCE = `{(${WEEKLY_NOTE_DAYS.join("|")}):(.*?)}`;

export const WEEKLY_NOTE_DATE_REGEX = new RegExp(
  WEEKLY_NOTE_DATE_REGEX_SOURCE,
  "g"
);

type FormatWeeklyNoteTitleArgs = {
  date: Date;
  format: string;
  formatDate: (date: Date, format: string) => string | null;
};

export const formatWeeklyNoteTitle = ({
  date,
  format,
  formatDate,
}: FormatWeeklyNoteTitleArgs): string | null => {
  const firstPlaceholderDay =
    new RegExp(WEEKLY_NOTE_DATE_REGEX_SOURCE).exec(format)?.[1] || "sunday";
  const weekStartsOn = WEEKLY_NOTE_DAYS.indexOf(
    firstPlaceholderDay as (typeof WEEKLY_NOTE_DAYS)[number]
  ) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  let isValid = true;

  const title = format.replace(
    WEEKLY_NOTE_DATE_REGEX,
    (_, day: string, dateFormat: string) => {
      const dayOfWeek = setDay(
        date,
        WEEKLY_NOTE_DAYS.indexOf(day as (typeof WEEKLY_NOTE_DAYS)[number]),
        { weekStartsOn }
      );
      const formatted = formatDate(dayOfWeek, dateFormat);
      if (formatted === null) {
        isValid = false;
        return "";
      }
      return formatted;
    }
  );

  return isValid ? title : null;
};

type ResolveSmartBlocksDateArgs = {
  expression: string;
  processBlockText: (text: string) => Promise<{ text: string }[]>;
  pageTitleToDate: (title: string) => Date | null;
};

export const resolveSmartBlocksDate = async ({
  expression,
  processBlockText,
  pageTitleToDate,
}: ResolveSmartBlocksDateArgs): Promise<Date> => {
  const blocks = await processBlockText(`<%DATE:${expression}%>`);
  const output = blocks[0]?.text?.trim() || "";
  const pageTitle = /^\[\[(.*)\]\]$/.exec(output)?.[1];
  const date = pageTitle ? pageTitleToDate(pageTitle) : null;

  if (!date || Number.isNaN(date.valueOf())) {
    throw new Error(`Could not resolve "${expression}" to a date`);
  }

  return date;
};
