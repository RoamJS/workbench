import * as chrono from "chrono-node";
import dayjs from "dayjs";

export const monthsDateProcessing = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

//return a real date if the date is a roam date, ex: [[November 1st, 2020]], otherwise returns nulll
export const testIfRoamDateAndConvert = (strDate: string) => {
  strDate = strDate.replace("[[", "").replace("]]", "");
  var testMonth = monthsDateProcessing.includes(strDate.match(/[A-z]+/)[0]);
  var testDay = ["st, ", "th, ", "nd, ", "rd, "].some((v) =>
    strDate.includes(v)
  );
  var testYear = Number.isNaN(
    strDate.substring(strDate.length - 4, strDate.length)
  );
  if (testDay && testMonth && testYear != true)
    return chrono.parseDate(strDate);
  else return null;
};

export const getTime24Format = () => {
  var dt = new Date();
  return (
    dt.getHours().toString().padStart(2, "0") +
    ":" +
    dt.getMinutes().toString().padStart(2, "0")
  );
};

export const getTimeAPPMFormat = () => {
  var dt = new Date();
  var hours = dt.getHours();
  var minutes = dt.getMinutes();
  var ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  var strTime =
    hours.toString().padStart(2, "0") +
    ":" +
    minutes.toString().padStart(2, "0") +
    " " +
    ampm;
  return strTime;
};

export const nthDate = (d: number) => {
  if (d > 3 && d < 21) return "th";
  switch (d % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

export const getRoamDate = (dateString: Date | string) => {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const date = d.getDate();
  const month = monthsDateProcessing[d.getMonth()];
  const nthStr = nthDate(date);
  return `${month} ${date}${nthStr}, ${year}`;
};

export const format_time = (date_obj: Date) => {
  // formats a javascript Date object into a 12h AM/PM time string
  var hour = date_obj.getHours();
  var minute = date_obj.getMinutes();
  var amPM = hour > 11 ? " PM" : " AM";
  if (hour > 12) {
    hour -= 12;
  } else if (hour == 0) {
    hour = 12;
  }
  return (
    hour.toString().padStart(2, "0") +
    ":" +
    minute.toString().padStart(2, "0") +
    amPM
  );
};

export const resolveDNPName = () => {
  var daily_notes_page_date = null;
  try {
    if (document.activeElement.nodeName == "TEXTAREA") {
      if (document.activeElement.closest(".roam-article") != null) {
        var page = document.activeElement;
        // try to resolve dates in best way possible
        //first by URL - most reliable
        daily_notes_page_date = chrono.parseDate(
          page.id.substring(
            page.id.search("body-outline-") + 13,
            page.id.length - 10
          )
        );
        // that didn't work, try by block id, also fairly accurate, but not always
        if (daily_notes_page_date == null)
          daily_notes_page_date = chrono.parseDate(
            window.location.hash.substring(
              window.location.hash.length - 10,
              window.location.hash.length
            )
          );
        // last attempt, try to use the rm-title-display class
        if (daily_notes_page_date == null)
          daily_notes_page_date = document.activeElement
            .closest(".roam-log-page")
            .querySelector<HTMLHeadingElement>(".rm-title-display").innerText;
      } else if (document.activeElement.closest(".sidebar-content") != null) {
        //inside the sidebar
        if (
          document.activeElement
            .closest(".rm-sidebar-outline")
            .querySelector("h1.rm-title-display")
        )
          daily_notes_page_date = testIfRoamDateAndConvert(
            document.activeElement
              .closest(".rm-sidebar-outline")
              .querySelector<HTMLHeadingElement>("h1.rm-title-display")
              .innerText
          );
        else if (
          document.activeElement
            .closest(".rm-sidebar-outline")
            .querySelector(".rm-zoom-item-content")
        )
          daily_notes_page_date = testIfRoamDateAndConvert(
            document.activeElement
              .closest(".rm-sidebar-outline")
              .querySelector<HTMLHeadingElement>(".rm-zoom-item-content")
              .innerText
          );
      }
    }
  } catch (e) {}
  return daily_notes_page_date;
};

const chronoCustomParser: chrono.Parser = {
  pattern: function () {
    return /DBOM|DEOM|DBOY|DEOY|DBONM|DEONM|DBONY|DEONY/i;
  },
  extract: function (context, match) {
    var basisYear = new Date().getFullYear();
    var basisMonth = new Date().getMonth();
    var dayOut;
    var monthOut;
    var yearOut;

    switch (match[0]) {
      case "DBOM": //Beginning of this month
        yearOut = basisYear;
        monthOut = basisMonth + 1;
        dayOut = 1;
        break;
      case "DEOM": //End of this month
        yearOut = basisYear;
        monthOut = basisMonth + 1;
        dayOut = new Date(yearOut, monthOut, 0).getDate();
        break;
      case "DBOY": //Beginning of Year
        yearOut = basisYear;
        monthOut = 1;
        dayOut = 1;
        break;
      case "DEOY": //End of YEAR
        yearOut = basisYear;
        monthOut = 12;
        dayOut = new Date(yearOut, monthOut, 0).getDate();
        break;
      case "DBONM": //begining of next month
        yearOut = basisMonth == 11 ? basisYear + 1 : basisYear;
        monthOut = basisMonth == 11 ? 1 : basisMonth + 2;
        dayOut = 1;
        break;
      case "DEONM": //beginnning of next month
        yearOut = basisMonth == 11 ? basisYear + 1 : basisYear;
        monthOut = basisMonth == 11 ? 1 : basisMonth + 2;
        dayOut = new Date(yearOut, monthOut, 0).getDate();
        break;
      case "DBONY": //beginning of next year
        yearOut = basisYear + 1;
        monthOut = 1;
        dayOut = 1;
        break;
      case "DEONY": //end of next year
        yearOut = basisYear + 1;
        monthOut = 12;
        dayOut = new Date(yearOut, monthOut, 0).getDate();
        break;
    }

    return context.createParsingResult(match.index, match[0], {
      day: dayOut,
      month: monthOut,
      year: yearOut,
    });
  },
};

const DAYS_OFFSET = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tues: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thurs: 4,
  thur: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const PATTERN = new RegExp(
  "(\\W|^)" +
    "(?:(?:\\,|\\(|\\（)\\s*)?" +
    "(?:on\\s*?)?" +
    "upcoming\\s*" +
    "(" +
    Object.keys(DAYS_OFFSET).join("|") +
    ")" +
    "(?=\\W|$)",
  "i"
);
// https://github.com/wanasit/chrono/blob/d8da3c840c50c959a62a0840c9a627f39bc765df/src/parsers/en/ENWeekdayParser.js
const comingWeekdayParser: chrono.Parser = {
  pattern: function () {
    return PATTERN;
  },
  extract: function (context, match) {
    var index = match.index + match[1].length;
    var text = match[0].substr(
      match[1].length,
      match[0].length - match[1].length
    );
    var result = context.createParsingResult(index, text);

    var dayOfWeek = match[2].toLowerCase();
    var offset = DAYS_OFFSET[dayOfWeek as keyof typeof DAYS_OFFSET];
    if (offset === undefined) {
      return null;
    }

    var startMoment = dayjs(context.refDate);
    var refOffset = startMoment.day();
    result.start.assign("weekday", offset);
    if (offset <= refOffset) {
      startMoment = startMoment.day(offset + 7);
      result.start.assign("day", startMoment.date());
      result.start.assign("month", startMoment.month() + 1);
      result.start.assign("year", startMoment.year());
    } else {
      startMoment = startMoment.day(offset);
      result.start.imply("day", startMoment.date());
      result.start.imply("month", startMoment.month() + 1);
      result.start.imply("year", startMoment.year());
    }

    return result;
  },
};

var customChrono42 = new chrono.Chrono();
customChrono42.parsers.push(chronoCustomParser);
customChrono42.parsers.unshift(comingWeekdayParser);

export const parseTextForDates = (str: string, reference_date = new Date()) => {
  var str_with_pages_removed = str.replace(/\[+\[[^)]+\]+\] */g, "");
  var txt = [];

  if (reference_date) {
    //forces parsing to use a specific date
    txt = customChrono42.parse(str_with_pages_removed, reference_date);
  } else {
    txt = customChrono42.parse(str_with_pages_removed);
  }

  if (txt.length > 0) {
    txt.forEach(function (element) {
      var roamDate = `[[${getRoamDate(element.start.date())}]] `;
      str = str.replace(element.text, roamDate);
    });
    return str;
  } else {
    return str;
  }
};
