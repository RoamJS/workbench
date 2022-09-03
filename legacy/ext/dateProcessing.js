// roam42.dailyNotesPopup
(()=>{

  roam42.dateProcessing = {};

  roam42.dateProcessing.monthsDateProcessing = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'];


  //return a real date if the date is a roam date, ex: [[November 1st, 2020]], otherwise returns nulll
  roam42.dateProcessing.testIfRoamDateAndConvert = (strDate)=> {
    strDate = strDate.replace('[[','').replace(']]','');
    var testMonth = roam42.dateProcessing.monthsDateProcessing.includes(strDate.match(/[A-z]+/)[0])
    var testDay   = ['st, ', 'th, ', 'nd, ', 'rd, '].some(v => strDate.includes(v));
    var testYear  = isNaN(strDate.substring(strDate.length-4,strDate.length))
    if(testDay && testMonth && testYear !=true)
      return chrono.parseDate(strDate)
    else
      return null
  }


  roam42.dateProcessing.getTime24Format = ()=> {
    var dt = new Date();
    return dt.getHours().toString().padStart(2, '0') + ':' + dt.getMinutes().toString().padStart(2, '0');
  }

  roam42.dateProcessing.getTimeAPPMFormat = ()=>{
      var dt = new Date();
      var hours = dt.getHours();
      var minutes = dt.getMinutes();
      var ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0'+minutes : minutes;
      var strTime = hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(0,2) + ' ' + ampm;
      return strTime;
  }

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


  roam42.dateProcessing.resolveDNPName = () =>{
    var daily_notes_page_date = null;
    try {
      if(document.activeElement.type=='textarea') {
        if(document.activeElement.closest('.roam-article')!=null) {
          var page = document.activeElement;
          // try to resolve dates in best way possible
          //first by URL - most reliable
          daily_notes_page_date = chrono.parseDate(page.id.substring(page.id.search('body-outline-')+13,page.id.length-10));
          // that didn't work, try by block id, also fairly accurate, but not always
          if(daily_notes_page_date==null)
            daily_notes_page_date = chrono.parseDate(window.location.hash.substring(window.location.hash.length-10,window.location.hash.length));
          // last attempt, try to use the rm-title-display class
          if(daily_notes_page_date==null)
            daily_notes_page_date = document.activeElement.closest('.roam-log-page').querySelector('.rm-title-display').innerText;
        } else if(document.activeElement.closest('.sidebar-content')!=null) {
          //inside the sidebar
          if(document.activeElement.closest('.rm-sidebar-outline').querySelector('h1.rm-title-display'))
            daily_notes_page_date =roam42.dateProcessing.testIfRoamDateAndConvert(document.activeElement.closest('.rm-sidebar-outline').querySelector('h1.rm-title-display').innerText);
          else if(document.activeElement.closest('.rm-sidebar-outline').querySelector('.rm-zoom-item-content'))
            daily_notes_page_date =roam42.dateProcessing.testIfRoamDateAndConvert(document.activeElement.closest('.rm-sidebar-outline').querySelector('.rm-zoom-item-content').innerText);
        }
      }
    } catch(e) {}
    return daily_notes_page_date;
  }

  //https://github.com/wanasit/chrono/tree/v1.x.x
  const chronoCustomParser = new chrono.Parser();
  chronoCustomParser.pattern = function () { return /DBOM|DEOM|DBOY|DEOY|DBONM|DEONM|DBONY|DEONY/i; };
  chronoCustomParser.extract = function(text, ref, match, opt) {
      var basisYear  = new Date().getFullYear();
      var basisMonth = new Date().getMonth();
      var dayOut;
      var monthOut;
      var yearOut;

      switch(match[0]){
        case "DBOM": //Beginning of this month
          yearOut = basisYear;
          monthOut= basisMonth+1;
          dayOut  = 1;
          break;
        case "DEOM":  //End of this month
          yearOut = basisYear;
          monthOut= basisMonth+1;
          dayOut  = new Date(yearOut, monthOut, 0).getDate();
          break;
        case "DBOY": //Beginning of Year
          yearOut = basisYear;
          monthOut= 1;
          dayOut  = 1;
          break;
        case "DEOY": //End of YEAR
          yearOut = basisYear;
          monthOut= 12;
          dayOut  = new Date(yearOut, monthOut, 0).getDate();
          break;
        case "DBONM": //begining of next month
          yearOut = basisMonth == 11 ? basisYear+1 : basisYear;
          monthOut= basisMonth == 11 ? 1 : basisMonth +2;
          dayOut  = 1
          break;
        case "DEONM": //beginnning of next month
          yearOut = basisMonth == 11 ? basisYear+1 : basisYear;
          monthOut= basisMonth== 11 ? 1 : basisMonth+2;
          dayOut  = new Date(yearOut, monthOut, 0).getDate();
          break;
        case "DBONY": //beginning of next year
          yearOut = basisYear+1;
          monthOut= 1;
          dayOut  = 1;
          break;
        case "DEONY": //end of next year
          yearOut = basisYear+1;
          monthOut= 12;
          dayOut  = new Date(yearOut, monthOut, 0).getDate();
          break;
      }

     return new chrono.ParsedResult({
          ref: ref,
          text: match[0],
          index: match.index,
          start: { day: dayOut, month: monthOut, year: yearOut }
      });

  };

  const DAYS_OFFSET = { 'sunday': 0, 'sun': 0, 'monday': 1, 'mon': 1,'tuesday': 2, 'tues':2, 'tue':2, 'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thurs':4, 'thur': 4, 'thu': 4,'friday': 5, 'fri': 5,'saturday': 6, 'sat': 6};

  const PATTERN = new RegExp('(\\W|^)' +
      '(?:(?:\\,|\\(|\\（)\\s*)?' +
      '(?:on\\s*?)?' +
      'upcoming\\s*' +
      '(' + Object.keys(DAYS_OFFSET).join('|') + ')' +
      '(?=\\W|$)', 'i');
  // https://github.com/wanasit/chrono/blob/d8da3c840c50c959a62a0840c9a627f39bc765df/src/parsers/en/ENWeekdayParser.js
  const comingWeekdayParser = new chrono.Parser();
  comingWeekdayParser.pattern = function() { 
    return PATTERN; 
  };
  comingWeekdayParser.extract = function(text, ref, match, ){
        var index = match.index + match[1].length;
        var text = match[0].substr(match[1].length, match[0].length - match[1].length);
        var result = new chrono.ParsedResult({
            index: index,
            text: text,
            ref: ref
        });

        var dayOfWeek = match[2].toLowerCase();
        var offset = DAYS_OFFSET[dayOfWeek];
        if(offset === undefined) {
            return null;
        }

        var startMoment = dayjs(ref);
        var refOffset = startMoment.day();
        result.start.assign('weekday', offset);
        if (offset <= refOffset) {
          startMoment = startMoment.day(offset + 7);
          result.start.assign('day', startMoment.date());
          result.start.assign('month', startMoment.month() + 1);
          result.start.assign('year', startMoment.year());
        } else {
          startMoment = startMoment.day(offset);
          result.start.imply('day', startMoment.date());
          result.start.imply('month', startMoment.month() + 1);
          result.start.imply('year', startMoment.year());
        }
        result.tags['comingWeekdayParser'] = true;

        return result;
    }

  var customChrono42 = new chrono.Chrono();
  customChrono42.parsers.push(chronoCustomParser);
  customChrono42.parsers.unshift(comingWeekdayParser);

  roam42.dateProcessing.parseTextForDates = (str, reference_date) => {
    var str_with_pages_removed = str.replace(/\[+\[[^)]+\]+\] */g, "");
    var txt = '';

    if (reference_date) { //forces parsing to use a specific date
      txt = customChrono42.parse( str_with_pages_removed, reference_date )
    }
    else {
      txt = customChrono42.parse( str_with_pages_removed);
    }

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
