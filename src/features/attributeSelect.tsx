import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Classes, Button, Dialog, Tabs, Tab, Card } from "@blueprintjs/core";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getBlockUidFromTarget from "roamjs-components/dom/getBlockUidFromTarget";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import AutocompleteInput from "roamjs-components/components/AutocompleteInput";
import createBlock from "roamjs-components/writes/createBlock";
import { OnloadArgs, PullBlock } from "roamjs-components/types";
import getSubTree from "roamjs-components/util/getSubTree";
import updateBlock from "roamjs-components/writes/updateBlock";
import deleteBlock from "roamjs-components/writes/deleteBlock";
import createPage from "roamjs-components/writes/createPage";
import { addCommand } from "./workBench";

const CONFIG = `roam/js/attribute-select`;

const ChooseAttributeOverlay = ({
  options,
  onClose,
  uid,
  attributeName,
}: RoamOverlayProps<{
  options: string[];
  uid: string;
  attributeName: string;
}>) => {
  const [value, setValue] = useState("");

  return (
    <Dialog
      title={`Select Value for ${attributeName}`}
      isOpen={true}
      onClose={onClose}
    >
      <div className={Classes.DIALOG_BODY}>
        <AutocompleteInput options={options} setValue={setValue} autoFocus />
        <Button
          disabled={!value}
          className="m-2"
          intent="primary"
          text={"Update"}
          onClick={() => {
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
const AttributeButton = ({
  attributeName,
  uid,
}: {
  attributeName: string;
  uid: string;
}) => {
  return (
    <Button
      icon="chevron-down"
      intent="primary"
      minimal
      onClick={(e) => {
        const configUid = getPageUidByPageTitle(CONFIG);
        //
        // How can this be optimized?
        //
        const attributesNode = getSubTree({
          key: "attributes",
          parentUid: configUid,
        });
        const attributeUid = getSubTree({
          key: attributeName,
          parentUid: attributesNode.uid,
        }).uid;
        const options = getSubTree({
          key: "options",
          parentUid: attributeUid,
        }).children.map((t) => t.text);
        renderOverlay({
          Overlay: ChooseAttributeOverlay,
          id: "attribute-select",
          props: { options, uid, attributeName },
        });
      }}
    />
  );
};

const renderAttributeButton = (
  parent: HTMLSpanElement,
  attributeName: string,
  blockUid: string
) => {
  const containerSpan = document.createElement("span");
  containerSpan.onmousedown = (e) => e.stopPropagation();
  ReactDOM.render(
    <AttributeButton attributeName={attributeName} uid={blockUid} />,
    containerSpan
  );
  parent.appendChild(containerSpan);
};

const AttributeConfigPanel = () => {
  const [value, setValue] = useState("");
  const [definedAttributes, setDefinedAttributes] = useState<string[]>(
    getDefinedAttributes()
  );
  const [activeTab, setActiveTab] = useState(definedAttributes[0]);
  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
  };
  const handleRemoveAttribute = (attribute: string) => {
    setDefinedAttributes((attrs) => attrs.filter((a) => a !== attribute));
    const index = definedAttributes.indexOf(activeTab);
    if (attribute === definedAttributes[index]) {
      setActiveTab(definedAttributes[0]);
    }
  };
  const configUid = getPageUidByPageTitle(CONFIG);
  const attributesUid = getSubTree({
    key: "attributes",
    parentUid: configUid,
  }).uid;
  window.roamAlphaAPI.data.block.update({
    block: {
      uid: attributesUid,
      open: false,
    },
  });
  const attributesInGraph = (
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
  )
    .map((p) => p[0]?.[":node/title"] || "")
    .filter((a) => !definedAttributes.includes(a));

  return (
    <div className={`${Classes.DIALOG_BODY} m-0`}>
      <div className="flex mb-8">
        <div id="attribute-select-autocomplete">
          <AutocompleteInput
            value={""}
            setValue={setValue}
            options={attributesInGraph}
            placeholder={"Choose Attribute To Add"}
          />
        </div>
        <Button
          intent="primary"
          className="mx-2"
          disabled={!value}
          text={"Add Attribute"}
          rightIcon={"plus"}
          style={{ marginLeft: 16 }}
          onClick={() => {
            createBlock({
              node: {
                text: value,
                children: [{ text: "options", children: [{ text: "" }] }],
              },
              order: "last",
              parentUid: attributesUid,
            }).then(() => {
              setDefinedAttributes(definedAttributes.concat([value]));
              setActiveTab(value);
              // Automcomplete setting value to "" is not working
              setValue("");
            });
          }}
        />
      </div>
      <Tabs
        id="attribute-select-attributes"
        vertical={true}
        onChange={handleTabChange}
        selectedTabId={activeTab}
      >
        {definedAttributes.map((a, i) => (
          <Tab
            className="w-full"
            id={a}
            title={a}
            panel={
              <TabsPanel
                key={activeTab}
                attributeName={a}
                attributesUid={attributesUid}
                handleRemoveAttribute={handleRemoveAttribute}
              />
            }
          />
        ))}
      </Tabs>
    </div>
  );
};
const TabsPanel = ({
  attributeName,
  attributesUid,
  handleRemoveAttribute,
}: {
  attributeName: string;
  attributesUid: string;
  handleRemoveAttribute: (attribute: string) => void;
}) => {
  const attributeUid = getSubTree({
    key: attributeName,
    parentUid: attributesUid,
  }).uid;
  const options = getSubTree({
    key: "options",
    parentUid: attributeUid,
  }).uid;

  const contentRef = useRef(null);
  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      window.roamAlphaAPI.ui.components.renderBlock({
        uid: options,
        el,
      });
    }
  }, [contentRef]);

  return (
    <div className="relative">
      <div ref={contentRef}></div>
      <Button
        intent="danger"
        className="mx-2 absolute right-0 top-0"
        text={"Remove Attribute"}
        rightIcon={"trash"}
        style={{ marginLeft: 16 }}
        onClick={() => {
          deleteBlock(attributeUid).then(() => {
            handleRemoveAttribute(attributeName);
          });
        }}
      />
    </div>
  );
};

const getDefinedAttributes = (): string[] => {
  const attributesUid = window.roamAlphaAPI.data.fast.q(
    `[:find ?u :where [?b :block/page ?p] [?b :block/uid ?u] [?b :block/string "attributes"] [?p :node/title "roam/js/attribute-select"]]`
  )[0]?.[0] as string;
  const attributesTree = getBasicTreeByParentUid(attributesUid);
  const definedAttributes = attributesTree.map((t) => t.text);
  return definedAttributes;
};

const ConfigPage = ({}: {}): React.ReactElement => {
  const titleRef = useRef<HTMLDivElement>(null);
  return (
    <Card style={{ color: "#202B33" }} className={"roamjs-config-panel"}>
      <div
        style={{ display: "flex", justifyContent: "space-between" }}
        ref={titleRef}
        tabIndex={-1}
      >
        <h4 style={{ paddingBottom: 4 }}>Attribute Select Configuration</h4>
      </div>
      <AttributeConfigPanel />
    </Card>
  );
};
const renderConfigPage = ({
  h,
  pageUid,
}: {
  h: HTMLHeadingElement;
  pageUid: string;
}) => {
  const uid = pageUid;
  const attribute = `data-roamjs-${uid}`;
  const containerParent = h.parentElement?.parentElement;
  if (containerParent && !containerParent.hasAttribute(attribute)) {
    containerParent.setAttribute(attribute, "true");
    const parent = document.createElement("div");
    const configPageId = "attribute-select";
    parent.id = `${configPageId}-config`;
    containerParent.insertBefore(
      parent,
      h.parentElement?.nextElementSibling || null
    );
    ReactDOM.render(<ConfigPage />, parent);
  }
};

const shutdown = () => {
  unloads.forEach((u) => u());
  unloads.clear();
};
const unloads = new Set<() => void>();
export const toggleFeature = async (
  flag: boolean,
  extensionAPI: OnloadArgs["extensionAPI"]
) => {
  if (flag) {
    const definedAttributes = getDefinedAttributes();
    const pageUid =
      getPageUidByPageTitle(CONFIG) ||
      (await createPage({
        title: CONFIG,
        tree: [{ text: "attributes" }],
      }));

    const observer = createHTMLObserver({
      className: "rm-title-display",
      tag: "H1",
      callback: (d: HTMLElement) => {
        const h = d as HTMLHeadingElement;
        if (h.innerText === CONFIG) {
          renderConfigPage({
            pageUid,
            h,
          });
        }
      },
    });
    const attributeObserver = createHTMLObserver({
      className: "rm-attr-ref",
      tag: "SPAN",
      callback: (s: HTMLSpanElement) => {
        const blockUid = getBlockUidFromTarget(s);
        const attributeUid = s.getAttribute("data-link-uid");
        const attributeName = attributeUid
          ? getPageTitleByPageUid(attributeUid)
          : "";
        if (
          !s.hasAttribute("data-roamjs-attribute-select") &&
          definedAttributes.includes(attributeName)
        ) {
          renderAttributeButton(s, attributeName, blockUid);
          s.setAttribute("data-roamjs-attribute-select", "true");
        }
      },
    });
    unloads.add(() => {
      observer.disconnect();
      attributeObserver.disconnect();
      addCommand(
        {
          label: "Refresh Attribute Select",
          callback: async () => {
            shutdown();
            toggleFeature(true, extensionAPI);
          },
        },
        extensionAPI
      );
    });
  } else {
    shutdown();
  }
};
