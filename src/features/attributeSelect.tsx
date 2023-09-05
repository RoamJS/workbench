import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Classes, Button, Dialog, Label } from "@blueprintjs/core";
import addStyle from "roamjs-components/dom/addStyle";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getBlockUidFromTarget from "roamjs-components/dom/getBlockUidFromTarget";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import AutocompleteInput from "roamjs-components/components/AutocompleteInput";
import CustomPanel from "roamjs-components/components/ConfigPanels/CustomPanel";
import createBlock from "roamjs-components/writes/createBlock";
import { PullBlock } from "roamjs-components/types";
import { createConfigObserver } from "roamjs-components/components/ConfigPage";
import getSubTree from "roamjs-components/util/getSubTree";
import updateBlock from "roamjs-components/writes/updateBlock";

const CONFIG = `roam/js/attribute-select`;

type Entry = { text: string };

const Overlay = ({
  options,
  onClose,
  uid,
  attributeName,
}: RoamOverlayProps<{
  options: string[];
  uid: string;
  attributeName: string;
}>) => {
  const [value, setValue] = useState<Entry>();

  return (
    <Dialog
      title={`Select Value for ${attributeName}`}
      isOpen={true}
      onClose={onClose}
    >
      <div className={Classes.DIALOG_BODY}>
        {/* <Label>
          Current Value:
          <span style={{ marginLeft: 8 }}>{currentvalue}</span>
        </Label> */}
        <AutocompleteInput options={options} setValue={setValue} autoFocus />
        <Button
          disabled={!value}
          className="m-2"
          intent="primary"
          text={"Update"}
          onClick={() => {
            console.log(uid, attributeName, value);
            updateBlock({
              text: `${attributeName}:: ${value}`,
              uid,
            });
            onClose();
          }}
        />
      </div>
    </Dialog>
  );
};
const AttributeButton = ({ attributeName, uid }) => {
  return (
    <Button
      icon="chevron-down"
      intent="primary"
      minimal
      onClick={(e) => {
        const configUid = getPageUidByPageTitle(CONFIG);
        const tree = getBasicTreeByParentUid(configUid);
        const attributeUid = tree.find((t) => t.text === "attributes")?.uid;
        const options = getSubTree({
          key: attributeName,
          parentUid: attributeUid,
        }).children.map((t) => t.text);
        console.log(options);
        renderOverlay({
          Overlay,
          id: "attribute-select",
          props: { tree, options, uid, attributeName },
        });
      }}
    />
  );
};

export const renderAttributeButton = (parent, attributeName, blockUid) => {
  const containerSpan = document.createElement("span");
  containerSpan.onmousedown = (e) => e.stopPropagation();
  ReactDOM.render(
    <AttributeButton attributeName={attributeName} uid={blockUid} />,
    containerSpan
  );
  parent.appendChild(containerSpan);
};

const attributeObserver = createHTMLObserver({
  className: "rm-attr-ref",
  tag: "SPAN",
  callback: (s: HTMLSpanElement) => {
    const blockUid = getBlockUidFromTarget(s);
    const attributeUid = s.getAttribute("data-link-uid");
    const attributeName = attributeUid
      ? getPageTitleByPageUid(attributeUid)
      : "";
    renderAttributeButton(s, attributeName, blockUid);
    s.setAttribute("data-roamjs-attribute-select", "true");
  },
});

const AttributePanel = () => {
  const [value, setValue] = useState<string>();

  const options = (
    window.roamAlphaAPI.data.fast.q(
      `[:find
        (pull ?page [:node/title])
      :where
        [?b :attrs/lookup _]
        [?b :entity/attrs ?a]
        [(untuple ?a) [[?c ?d]]]
        [(get ?d :value) ?s]
        [(untuple ?s) [?e ?uid]]
        [?page :block/uid ?uid]
      ]`
    ) as [PullBlock][]
  ).map((p) => p[0]?.[":node/title"] || "");

  const parentUid = getPageUidByPageTitle(CONFIG);
  return (
    <div className={Classes.DIALOG_BODY}>
      <Label style={{ width: 120, marginBottom: 0 }}>
        Attribute Label
        <AutocompleteInput
          value={value}
          setValue={setValue}
          options={options}
          placeholder={"search"}
        />
      </Label>
      <Button
        disabled={!value}
        text={"Add"}
        rightIcon={"plus"}
        style={{ marginLeft: 16 }}
        onClick={() => {
          createBlock({
            node: {
              text: value,
            },
            parentUid,
          });
        }}
      />
    </div>
  );
};
const unloads = new Set<() => void>();
export const toggleFeature = (flag: boolean) => {
  if (flag) {
    createConfigObserver({
      title: "roam/js/attribute-select",
      config: {
        tabs: [
          {
            id: "home",
            fields: [
              {
                title: "attributes",
                Panel: CustomPanel,
                description: "Specify the attributes you want to use.",
                options: {
                  component: AttributePanel,
                },
              },
            ],
          },
        ],
      },
    }).then((a) => unloads.add(() => a.observer.disconnect()));
    unloads.add(() => attributeObserver.disconnect());
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
