Can this be incorporated?
Creates a roam formatted date
  export const getRoamDate = dateString => {
    const d = new Date(dateString);
    const year = d.getFullYear();
    const date = d.getDate();
    const month = months[d.getMonth()];
    const nthStr = nth(date);
    return `${month} ${date}${nthStr}, ${year}`;
  };

(1) shortcut for doing strikethrough on the current node

(2) VIM MODE? https://github.com/tntmarket/vimmyroam
