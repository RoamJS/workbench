import format from "date-fns/format";
import setDay from "date-fns/setDay";
import { DAILY_NOTE_PAGE_REGEX } from "roamjs-components/date/constants";
import parseNlpDate from "roamjs-components/date/parseNlpDate";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";

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
  "g",
);

type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const getWeeklyNoteDayIndex = (day: string): WeekStartsOn => {
  const index = WEEKLY_NOTE_DAYS.findIndex((d) => d === day);
  return (index < 0 ? 0 : index) as WeekStartsOn;
};

const getWeekStartsOn = (weeklyNoteFormat: string): WeekStartsOn =>
  getWeeklyNoteDayIndex(
    weeklyNoteFormat.match(new RegExp(WEEKLY_NOTE_DATE_REGEX.source))?.[1] ||
      "sunday",
  );

export const formatWeeklyNotePageTitle = ({
  date,
  weeklyNoteFormat,
}: {
  date: Date;
  weeklyNoteFormat: string;
}) => {
  const weekStartsOn = getWeekStartsOn(weeklyNoteFormat);
  return weeklyNoteFormat.replace(
    WEEKLY_NOTE_DATE_REGEX,
    (_, day: string, dayFormat: string) =>
      format(
        setDay(date, getWeeklyNoteDayIndex(day), { weekStartsOn }),
        dayFormat,
        { useAdditionalWeekYearTokens: true },
      ),
  );
};

const getSmartBlocksDateBasis = ({
  targetUid,
  variables,
}: {
  targetUid: string;
  variables: Record<string, string>;
}) => {
  const dateBasisMethod = variables.DATEBASISMETHOD;
  if (dateBasisMethod === "DNP") {
    const title =
      getPageTitleByBlockUid(targetUid) || getPageTitleByPageUid(targetUid);
    const date = DAILY_NOTE_PAGE_REGEX.test(title)
      ? window.roamAlphaAPI.util.pageTitleToDate(title) || new Date()
      : new Date();
    const now = new Date();
    date.setHours(now.getHours());
    date.setMinutes(now.getMinutes());
    return date;
  }

  if (dateBasisMethod) return new Date(dateBasisMethod);
  return new Date();
};

export const resolveWeeklyNotePageTitle = ({
  expression = "today",
  targetUid,
  variables,
  weeklyNoteFormat,
}: {
  expression?: string;
  targetUid: string;
  variables: Record<string, string>;
  weeklyNoteFormat: string;
}) => {
  const dateBasis = getSmartBlocksDateBasis({ targetUid, variables });
  const resolvedDate = parseNlpDate(expression || "today", dateBasis);
  return formatWeeklyNotePageTitle({
    date: /^\s*this\s+week\s*$/i.test(expression) ? dateBasis : resolvedDate,
    weeklyNoteFormat,
  });
};
