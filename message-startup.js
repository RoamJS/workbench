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
    <div style='font-size:7pt'>marvin.2020-08-21</div>
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