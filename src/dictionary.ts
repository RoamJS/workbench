import AutocompleteInput from "roamjs-components/components/AutocompleteInput";
import iziToast from "izitoast";
import { insertAtCaret } from "./commonFunctions";
import React from "react";
import ReactDOM from "react-dom";

export let currentTextArea = "";

export const typeAheadLookup = (target?: Element) => {
  if (target?.localName == "textarea") {
    typeaheadDisplayTextArea(target.id);
  } else {
    typeaheadDisplayOtherAreas();
  }
};

export const typeaheadDisplayTextArea = (srcElementId: string) => {
  currentTextArea = srcElementId;
  $("#rmSearch").show();
  $("#rmSearchBox").focus();
};

export const typeaheadDisplayOtherAreas = () => {
  currentTextArea = "OTHERAREAS";
  document.getElementById("rmSearch").style.display = "block";
  document.getElementById("#rmSearchBox").focus();
};

const TypeAhead = () => {
  const [value, setValue] = React.useState("");
  const [options, setOptions] = React.useState([]);
  React.useEffect(() => {
    if (value) {
      fetch(`https://wordnet.glitch.me/query?search=${value}`)
        .then((res) => res.json())
        .then(setOptions);
    }
  }, [value]);
  return React.createElement(AutocompleteInput, {
    value,
    setValue,
    options,
    placeholder: "search",
    onConfirm: () => {
      if (currentTextArea == "OTHERAREAS") {
        // @ts-ignore - TODO
        displayDataInToast(value);
      } else {
        insertDataIntoNode(
          currentTextArea,
          // @ts-ignore - TODO
          value
        );
      }
    },
    onBlur: () => {
      setValue("");
      document.getElementById("rmSearch").style.display = "none";
    },
    // @ts-ignore - TODO
    id: "rmSearchBox",
    className: "typeahead",
    renderOption: typeaheadResult,
  });
};

export let enabled = false;

export const loadTypeAhead = () => {
  enabled = true;
  const rmSearch = document.createElement("div");
  rmSearch.id = "rmSearch";
  document.body.appendChild(rmSearch);

  ReactDOM.render(TypeAhead(), rmSearch);
};

export const toggleFeature = (flag: boolean) => {
  if (flag) loadTypeAhead();
  else {
    document.getElementById("rmSearch")?.remove?.();
    enabled = false;
  }
};

export const typeaheadQueryURL =
  "https://wordnet.glitch.me/query?search=%QUERY";
export const typeaheadDisplayField = "word";

type Entry = { word: string; definition: string; type: string };

export const typeaheadResult = (d: Entry) => {
  return `<div class="th-item">
              <div class="th-term"> ${d.word}       </div>
              <div class="th-def">  ${d.definition} </div>
          </div>`;
};

export const displayDataInToast = (d: Entry) => {
  let display = `<b>${d.word}</b><br/> ${d.definition}`;
  iziToast.show({
    message: display,
    progressBar: true,
    animateInside: true,
    close: true,
    maxWidth: 250,
    timeout: 60000,
    closeOnClick: true,
    displayMode: 2,
  });
};

export const insertDataIntoNode = (currentTextArea: string, d: Entry) => {
  insertAtCaret(currentTextArea, `**${d.word}** (${d.type})\n ${d.definition}`);
};
