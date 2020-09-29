/* globals roam42, chrono,kbMapDateProcessing, setEmptyNodeValue */

// roam42.dailyNotesPopup 
(()=>{
  
  roam42.dateProcessing = {};
  
  roam42.dateProcessing.monthsDateProcessing = [
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

  roam42.dateProcessing.nthDate = d => {
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

  roam42.dateProcessing.getRoamDate = dateString => {
    const d = new Date(dateString);
    const year = d.getFullYear();
    const date = d.getDate();
    const month = roam42.dateProcessing.monthsDateProcessing[d.getMonth()];
    const nthStr = roam42.dateProcessing.nthDate(date);
    return `${month} ${date}${nthStr}, ${year}`;
  }

  roam42.dateProcessing.format_time = date_obj => {
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

  roam42.dateProcessing.parseTextForDates = (str) => {
    var txt = chrono.parse( str,  new Date() , { forwardDate: true } )
    if (txt.length > 0) {
      txt.forEach(function(element) {
        var roamDate = '';
        try {
          if ( element.tags.ENTimeExpressionParser === true || 
               element.tags.ZHTimeExpressionParser === true   ) {
              roamDate = roam42.dateProcessing.format_time(element.start.date());
            if(element.end) {
              roamDate = `${roamDate} - ${roam42.dateProcessing.format_time(element.end.date())}`;
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
            roamDate = `[[${roam42.dateProcessing.getRoamDate(element.start.date())}]] ${roamDate}`;
          }
        } catch (err) {}
        str = str.replace(element.text, roamDate);
      });
      return str;
    } else {
      return str;
    }
  }
  
})();
