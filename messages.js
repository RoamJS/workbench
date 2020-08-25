/* globals iziToast */

const displayStartup = (delayTime) => { 
  iziToast.show({
    message: `
    <b>Roam42 Starting . . .</b>
    <p></p>
    <table>
      <tr><td>Alt–Shift–H </td><td>&nbsp</td><td>Roam42 Help</td></tr>
      <tr><td>Ctrl–Shift–H</td><td>&nbsp</td><td>Quick Reference</td></tr>
    </table>
    <p></p>
    <div style='font-size:7pt'>marvin.2020-08-25</div>
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

const displayHelp = (delayTime) => { 
   iziToast.destroy(); 
   iziToast.show({
      message: `
    <b>Roam42 Help</b><p></p>
    <table>
      <tr><td>Ctrl–Shift–H</td><td>&nbsp</td> <td>Roam Quick Reference</td></tr>
      <tr><td>&nbsp       </td><td>&nbsp</td> <td>&nbsp</td></tr>
      <tr><td>Alt–Shift–D</td><td>&nbsp</td>  <td>Convert to Date</td></tr>
      <tr><td>Alt–Shift–J</td><td>&nbsp</td>  <td>Jump to Date</td></tr>
      <tr><td>Ctrl–Shift–.</td><td>&nbsp</td> <td>Next Day's Note</td></tr>
      <tr><td>Ctrl–Shift–,</td><td>&nbsp</td> <td>Previous Day's Note</td></tr>
      <tr><td>&nbsp       </td><td>&nbsp</td> <td>&nbsp</td></tr>
      <tr><td>Alt–j</td><td>&nbsp</td>        <td>Jump to first block in page</td></tr>
      <tr><td>Alt–k</td><td>&nbsp</td>        <td>Jump to last block in page</td></tr>
      <tr><td>&nbsp       </td><td>&nbsp</td> <td>&nbsp</td></tr>
      <tr><td>Hover mouse </td><td>&nbsp</td> <td>Live Preview</td></tr>
      <tr><td>Ctrl–Shift–L</td><td>&nbsp</td> <td>Toggle Live Preview<br/> on/off</td></tr>
      <tr><td>&nbsp       </td><td>&nbsp</td> <td>&nbsp</td></tr>
      <tr><td>Alt–Shift–/</td><td>&nbsp</td>  <td>Open side bar</td></tr>
      <tr><td>Alt–Shift–,</td><td>&nbsp</td>  <td>Daily popup </td></tr>
      <tr><td>Alt–Shift–.</td><td>&nbsp</td>  <td>Dictionary Lookup</td></tr>
      <tr><td>Alt–m      </td><td>&nbsp</td>  <td>Markdown (simple)</td></tr>
      <tr><td>&nbsp       </td><td>&nbsp</td> <td>&nbsp</td></tr>
      <tr><td>Alt–Shift–A</td><td>&nbsp</td>  <td>TODO #na</td></tr>
      <tr><td>Alt–Shift–W</td><td>&nbsp</td>  <td>TODO #weekend</td></tr>
      <tr><td>Alt–Shift–T</td><td>&nbsp</td>  <td>Strikeout text</td></tr>
    </table>
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
