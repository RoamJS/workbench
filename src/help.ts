import iziToast from "izitoast";

export const displayMessage = (sMessage: string, delayTime = 0) => {
  iziToast.show({
    message: sMessage,
    theme: "dark",
    progressBar: true,
    animateInside: true,
    close: false,
    timeout: delayTime,
    closeOnClick: true,
    maxWidth: 300,
    displayMode: 2,
  });
};
