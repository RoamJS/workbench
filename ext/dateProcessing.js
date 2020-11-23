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
  
  //return a real date if the date is a roam date, ex: [[November 1st, 2020]], otherwise returns nulll
  roam42.dateProcessing.testIfRoamDateAndConvert = (strDate)=> {
    strDate = strDate.replace('[[','').replace(']]','');
    var testMonth = roam42.dateProcessing.monthsDateProcessing.includes(strDate.match(/[A-z]+/)[0])
    var testYear  = isNaN(strDate.substring(strDate.length-4,strDate.length))
    if(testMonth && testYear !=true) 
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

  roam42.dateProcessing.parseTextForDates = (str) => {
    var str_with_pages_removed = str.replace(/\[+\[[^)]+\]+\] */g, "");
    
    var txt = chrono.parse( str_with_pages_removed )

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

  window.roam42.dateProcessing.testingDateProcessing = () => {
    roam42.loader.addScriptToPage( "smartBlocksRB", roam42.host + 'ext/dateProcessing.js');
  };  
  
})();
