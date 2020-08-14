(1) Color coding of highlights. Check out:
    https://greasyfork.org/en/scripts/402699-ryan-guill-s-roam-experiments-roamresearch-com

(2) VIM MODE? 
    https://github.com/tntmarket/vimmyroam

(3) Can this code be used (cross out checked time)

    function setCheckboxClass(checkbox) {
      let span = checkbox.closest('.roam-block > span');
      if(checkbox.checked) {
        span.classList.add("custom-strikethrough");
      } else {
        span.classList.remove("custom-strikethrough");
      }
    }

    function scanCheckboxes() {
      document.querySelectorAll(".check-container input")
        .forEach(setCheckboxClass);  
    };

    console.log("START CUSTOM JS - Checkbox Strikeout v2");
    setInterval(scanCheckboxes, 1000); 

(4) Named entity recognition
https://twitter.com/roamhacker/status/1281326618162663425?s=21


