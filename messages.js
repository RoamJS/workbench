/*   globals roam42, iziToast, getRoamNavigator_IsEnabled, logo2HC, 
     getRoamLivePreviewState, getAutoComplete_IsEnabled 
*/

// roam42.help 
(()=>{
  roam42.help = {};

  roam42.help.keyboardHandlerMessages = ev => {
    if (ev.altKey && ev.shiftKey && ev.code=='KeyH' ) { 
      ev.stopImmediatePropagation()
      ev.preventDefault()        
      roam42.help.displayHelp(10000) 
      return true
    }
  }
  
  roam42.help.displayMessage = (sMessage, delayTime) => { 
  iziToast.show({
    message: sMessage,
    theme: 'dark',
    progressBar: true,
    animateInside: true,
    close: false,  
    timeout: delayTime,  
    closeOnClick: true,  
    displayMode: 2  
  });  
  }

  roam42.help.displayStartup = (delayTime) => { 
    iziToast.show({
      message: `
      <div style="position:absolute;top:-75px;right:-15px;z-index:1000;">
        <img width="50px" src="${roam42.loader.logo2HC}"></img>
      </div>
      <b>Roam42 Starting . . .   </b>   
      <table>
        <tr><td>Alt–Shift–H </td><td>&nbsp</td><td>Help</td></tr>
      </table>
      <div style='font-size:7pt'>${roam42.buildID}</div>
    `.trim(),
      theme: 'dark',
      progressBar: true,
      animateInside: true,
      close: false,  
      timeout: delayTime,  
      closeOnClick: true,  
      displayMode: 2  
    });  
  }

  roam42.help.displayHelp = (delayTime) => { 
     iziToast.destroy(); 
     iziToast.show({
      message: `
      <div style="position:absolute;top:-95px;right:-15px;z-index:1000;">
        <img width="70px" src="${roam42.loader.logo2HC}"></img>
      </div>
      <b>Roam42 Help</b>
      <br/>
      <br/>
      <table>
        <tr><td>Ctrl–Shift–H</td><td>&nbsp</td> <td>Roam Quick Reference</td><td></td></tr>
        <tr><td>&nbsp       </td><td>&nbsp</td> <td>&nbsp</td>               <td></td></tr>
        <tr><td>Alt–Shift–D</td><td>&nbsp</td>  <td>Convert to Date</td>     <td></td></tr>
        <tr><td>Alt–Shift–J</td><td>&nbsp</td>  <td>Jump to Date</td>        <td></td></tr>
        <tr><td>Ctrl–Shift–.</td><td>&nbsp</td> <td>Next Day's Note</td>     <td></td></tr>
        <tr><td>Ctrl–Shift–,</td><td>&nbsp</td> <td>Previous Day's Note</td> <td></td></tr>
        <tr><td>&nbsp       </td><td>&nbsp</td> <td>&nbsp</td>               <td></td></tr>
        <tr><td>Meta–j h</td><td>&nbsp</td>     <td>Jump Nav help</td>       <td></td></tr>
        <tr><td></td>        <td>&nbsp</td>     <td>or Ctrl-j h or Alt-j h</td><td></td></tr>
        <tr><td>Alt–g</td><td>&nbsp</td>     <td>Deep jump nav</td><td class="bp3-button bp3-minimal bp3-icon-settings" onclick="roamNavigatorStatusToast()"></td></tr>
        ${getRoamNavigator_IsEnabled() ? '' : '<tr><td>&nbsp       </td><td>&nbsp</td> <td>(Disabled)</td><td></td></tr>'}
        <tr><td>&nbsp       </td><td>&nbsp</td> <td>&nbsp</td>                <td></td></tr>

        <tr><td>Ctrl+Shift+l</td><td>&nbsp</td> <td>Toggle Live Preview (Alt+L)</td><td class="bp3-button bp3-minimal bp3-icon-settings" onclick="livePreviewStatusToast()"></td></tr>
        <tr><td>Hover mouse </td><td>&nbsp</td> <td>Live Preview</td>         <td></td></tr>
        ${getRoamLivePreviewState() > 0 ? '' : '<tr><td>&nbsp       </td><td>&nbsp</td> <td>(Disabled)</td><td></td></tr>'}
        <tr><td>&nbsp       </td><td>&nbsp</td> <td>&nbsp</td>                <td></td></tr>

        <tr><td>Shift-space    </td><td>&nbsp</td> <td>Autocomplete blocks/search bar</td><td class="bp3-button bp3-minimal bp3-icon-settings" onclick="autoCompleteStatusToast()"></td></tr>
        ${getAutoComplete_IsEnabled() ? '' : '<tr><td>&nbsp       </td><td>&nbsp</td> <td>(Disabled)</td><td></td></tr>'}

        <tr><td>&nbsp       </td><td>&nbsp</td> <td>&nbsp</td>                    <td></td></tr>
        <tr><td>Alt–Shift–\\</td><td>&nbsp</td>  <td>Open left side bar</td>      <td></td> </tr>
        <tr><td>Alt–Shift–/</td><td>&nbsp</td>  <td>Open right side bar</td>      <td></td></tr>
        <tr><td>Alt–Shift–,</td><td>&nbsp</td>  <td>Daily popup </td>             <td></td></tr>
        <tr><td>Alt–Shift–.</td><td>&nbsp</td>  <td>Dictionary Lookup</td>        <td></td></tr>
        <tr><td>Alt–m      </td><td>&nbsp</td>  <td>Markdown (simple)</td>        <td></td></tr>
        <tr><td>&nbsp       </td><td>&nbsp</td> <td>&nbsp</td>                    <td></td></tr>
        <tr><td>Alt–Shift–a</td><td>&nbsp</td>  <td>TODO #na</td>                 <td></td></tr>
        <tr><td>Alt–Shift–w</td><td>&nbsp</td>  <td>TODO #weekend</td>            <td></td></tr>
        <tr><td>Alt–Shift–t</td><td>&nbsp</td>  <td>Strikeout text</td>           <td></td></tr>
      </table>
      <div style='font-size:7pt'>${roam42.buildID}</div>
      `.trim(),
        theme: 'dark',
        progressBar: true,
        animateInside: true,
        close: false,
        timeout: delayTime,
        closeOnClick: true,
        displayMode: 2
      });
  }

})();
