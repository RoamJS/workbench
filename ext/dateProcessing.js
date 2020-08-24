/* globals chrono,hotkeys,kbMapDateProcessing, setEmptyNodeValue */

const monthsDateProcessing = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const nthDate = d => {
  if (d > 3 && d < 21) return 'th';
  switch (d % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

const getRoamDate = dateString => {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const date = d.getDate();
  const month = monthsDateProcessing[d.getMonth()];
  const nthStr = nthDate(date);
  return `${month} ${date}${nthStr}, ${year}`;
}

const format_time = date_obj => {
  // formats a javascript Date object into a 12h AM/PM time string
  var hour = date_obj.getHours();
  var minute = date_obj.getMinutes();
  var amPM = hour > 11 ? ' PM' : ' AM';
  if (hour > 12) {
    hour -= 12;
  } else if (hour == 0) {
    hour = '12';
  }
  if (minute < 10) {
    minute = '0' + minute;
  }
  return hour + ':' + minute + amPM;
}

const parseTextForDates = (str) => {
  var txt = chrono.parse( str,  new Date() , { forwardDate: true } )
  if (txt.length > 0) {
    txt.forEach(function(element) {
      var roamDate = '';
      try {
        if ( element.tags.ENTimeExpressionParser === true || 
             element.tags.ZHTimeExpressionParser === true   ) {
            roamDate = format_time(element.start.date());
          if(element.end) {
            roamDate = `${roamDate} - ${format_time(element.end.date())}`
          }
        }
      } catch (err) {}
      try {
        if (
          element.tags.ENWeekdayParser === true ||
          element.tags.ENMonthNameParser === true ||
          element.tags.ENCasualDateParser === true ||
          element.tags.ENISOFormatParser === true ||
          element.tags.ENMonthNameMiddleEndianParser === true ||
          element.tags.ENMonthNameLittleEndianParser === true ||
          element.tags.length === undefined
        ) {
          roamDate = `[[${getRoamDate(element.start.date())}]] ${roamDate}`
        }
      } catch (err) {}
      str = str.replace(element.text, roamDate);
    });
    return str;
  } else {
    return str;
  }
}
