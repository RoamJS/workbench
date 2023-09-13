import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { Classes, Button, Tabs, Tab, Card, Popover } from "@blueprintjs/core";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getBlockUidFromTarget from "roamjs-components/dom/getBlockUidFromTarget";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import createBlock from "roamjs-components/writes/createBlock";
import { PullBlock } from "roamjs-components/types";
import getSubTree from "roamjs-components/util/getSubTree";
import updateBlock from "roamjs-components/writes/updateBlock";
import deleteBlock from "roamjs-components/writes/deleteBlock";
import createPage from "roamjs-components/writes/createPage";
import MenuItemSelect from "roamjs-components/components/MenuItemSelect";

const CONFIG = `roam/js/attribute-select`;

const ChooseAttributeOverlay = ({
  options,
  onClose,
  uid,
  attributeName,
}: {
  options: string[];
  onClose: () => void;
  uid: string;
  attributeName: string;
}) => {
  const [value, setValue] = useState("");

  return (
    <div className="roamjs-attribute-select-popover p-4">
      <MenuItemSelect
        items={options}
        onItemSelect={(s) => setValue(s)}
        activeItem={value}
        filterable={true} // change roamjs-components to allow for filter
        // createNewItemRenderer={} // https://blueprintjs.com/docs/versions/3/#select/select-component
        // createNewItemFromQuery={} // https://blueprintjs.com/docs/versions/3/#select/select-component
      />
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
  );
};
const AttributeButton = ({
  attributeName,
  uid,
}: {
  attributeName: string;
  uid: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const configUid = getPageUidByPageTitle(CONFIG);
      const attributesNode = getSubTree({
        key: "attributes",
        parentUid: configUid,
      });
      const attributeUid = getSubTree({
        key: attributeName,
        parentUid: attributesNode.uid,
      }).uid;
      const newOptions = getSubTree({
        key: "options",
        parentUid: attributeUid,
      }).children.map((t) => t.text);

      setOptions(newOptions);
    }
  }, [isOpen]);

  return (
    <Popover
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      content={
        <>
          <ChooseAttributeOverlay
            options={options}
            uid={uid}
            attributeName={attributeName}
            onClose={() => setIsOpen(false)}
          />
        </>
      }
    >
      <Button
        icon="chevron-down"
        intent="primary"
        minimal
        onClick={() => setIsOpen(true)}
      />
    </Popover>
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

const AttributeConfigPanel = ({
  onAdd,
  onRemove,
}: {
  onAdd: (attr: string) => void;
  onRemove: (attr: string) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAddAttribute, setShowAddAttribute] = useState(false);
  const [query, setQuery] = useState("");
  const [value, setValue] = useState("");
  const [definedAttributes, setDefinedAttributes] = useState<string[]>(() =>
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
    onRemove(attribute);
  };
  const configUid = getPageUidByPageTitle(CONFIG);
  const attributesUid = getSubTree({
    key: "attributes",
    parentUid: configUid,
  }).uid;
  useEffect(() => {
    window.roamAlphaAPI.data.block.update({
      block: {
        uid: attributesUid,
        open: false,
      },
    });
  }, [configUid]);
  const getAttributesInGraph = () => {
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
    ).map((p) => p[0]?.[":node/title"] || "");
    setAttributesInGraph(attributesInGraph);
  };

  const [attributesInGraph, setAttributesInGraph] = useState<string[]>([]);

  const focusBlock = (uid: string) => {
    const el = document.querySelector(
      `.attribute-${uid} .rm-api-render--block .rm-level-1 .rm-block__input`
    );
    if (!el) return;
    const match = el.id.match(
      /block-input-(uuid[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12})-([\w\d]+)/i
    );
    if (match) {
      const location = match[1];
      const blockUid = match[2];
      window.roamAlphaAPI.ui.setBlockFocusAndSelection({
        location: {
          "block-uid": blockUid,
          "window-id": location,
        },
      });
    }
  };

  const handleAddAttribute = async () => {
    const uid = await createBlock({
      node: {
        text: value,
        children: [{ text: "options", children: [{ text: "" }] }],
      },
      order: "last",
      parentUid: attributesUid,
    });

    setDefinedAttributes([...definedAttributes, value]);
    setActiveTab(value);
    setValue("");
    onAdd(value);
    setQuery("");

    focusBlock(uid);
  };

  return (
    <div className={`${Classes.DIALOG_BODY} m-0`}>
      <div className="flex mb-8 items-center">
        {showAddAttribute ? (
          <>
            <Button
              intent="primary"
              className="mr-2"
              disabled={!value}
              text={"Add Attribute"}
              rightIcon={"plus"}
              onClick={handleAddAttribute}
            />
            <div id="attribute-select-autocomplete">
              <MenuItemSelect
                items={attributesInGraph.filter(
                  (a) => !definedAttributes.includes(a)
                )}
                onItemSelect={(s) => setValue(s)}
                activeItem={value}
                filterable={true}
                query={query}
                onQueryChange={(newQuery) => setQuery(newQuery)}
              />
            </div>
          </>
        ) : (
          <>
            <Button
              intent="primary"
              text={"Add An Attribute"}
              rightIcon={"plus"}
              loading={isLoading}
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  getAttributesInGraph();
                  setIsLoading(false);
                  setShowAddAttribute(true);
                }, 0);
              }}
            />
            <div className="text-gray-500 ml-2">
              {isLoading ? "Loading Attributes..." : ""}
            </div>
          </>
        )}
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
  const [potentialOptions, setPotentialOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [showPossibleOptions, setShowPotentialOptions] = useState(false);
  const { attributeUid, optionsNode, chosenOptions } = useMemo(() => {
    const attributeUid = getSubTree({
      key: attributeName,
      parentUid: attributesUid,
    }).uid;
    const optionsNode = getSubTree({
      key: "options",
      parentUid: attributeUid,
    });
    const chosenOptions = optionsNode.children.map((t) => t.text);
    return { attributeUid, optionsNode, chosenOptions };
  }, [attributeName, attributesUid]);

  // For a better UX replace renderBlock with a controlled list
  // add Edit, Delete, and Add New buttons
  const contentRef = useRef(null);
  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      window.roamAlphaAPI.ui.components.renderBlock({
        uid: optionsNode.uid,
        el,
      });
    }
  }, [contentRef]);

  const findAllPotentialOptions = (attributeName: string) => {
    const regex = new RegExp(`^${attributeName}::\\s*`);
    return Array.from(
      new Set(
        window.roamAlphaAPI.data.fast
          .q(
            `
        [:find ?b :where [?r :node/title "${attributeName}"] [?c :block/refs ?r] [?c :block/string ?b]]`
          )
          .map((p) => {
            const rawString = p[0] as string;
            return rawString.replace(regex, "").trim();
          })
      )
    )
      .filter((option) => option !== "")
      .filter((option) => !chosenOptions.includes(option))
      .sort();
  };

  return (
    <div className="relative flex">
      <div
        ref={contentRef}
        className={`flex-1 attribute-${attributeUid}`}
      ></div>
      <div className="flex flex-col items-start flex-1 space-y-4 mx-2">
        <Button
          intent="danger"
          text={"Remove Attribute"}
          rightIcon={"trash"}
          onClick={() => {
            deleteBlock(attributeUid).then(() => {
              handleRemoveAttribute(attributeName);
            });
          }}
        />
        <Button
          intent="primary"
          text={"Find All Current Values"}
          rightIcon={"search"}
          onClick={() => {
            const potentialOptions = findAllPotentialOptions(attributeName);
            setPotentialOptions(potentialOptions);
            setShowPotentialOptions(true);
          }}
        />
        {showPossibleOptions && (
          <div className="flex items-start space-x-4">
            {!potentialOptions.length && (
              <div className="text-gray-500">No additional values found</div>
            )}
            {potentialOptions.length > 0 && (
              <>
                <MenuItemSelect
                  items={potentialOptions}
                  onItemSelect={(s) => setSelectedOption(s)}
                  activeItem={selectedOption}
                  filterable={true}
                />
                <Button
                  disabled={!selectedOption}
                  intent="primary"
                  text={"Add Option"}
                  rightIcon={"plus"}
                  onClick={() => {
                    if (chosenOptions.length === 1 && chosenOptions[0] === "") {
                      updateBlock({
                        uid: optionsNode.children[0].uid,
                        text: selectedOption,
                      });
                    } else {
                      createBlock({
                        node: {
                          text: selectedOption,
                        },
                        order: "last",
                        parentUid: optionsNode.uid,
                      });
                    }
                    setPotentialOptions(
                      potentialOptions.filter(
                        (option) => option !== selectedOption
                      )
                    );
                    setSelectedOption("");
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>
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

const ConfigPage = ({
  onAdd,
  onRemove,
}: {
  onAdd: (attr: string) => void;
  onRemove: (attr: string) => void;
}): React.ReactElement => {
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
      <AttributeConfigPanel onAdd={onAdd} onRemove={onRemove} />
    </Card>
  );
};
const renderConfigPage = ({
  h,
  pageUid,
  onAdd,
  onRemove,
}: {
  h: HTMLHeadingElement;
  pageUid: string;
  onAdd: (attr: string) => void;
  onRemove: (attr: string) => void;
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
    ReactDOM.render(<ConfigPage onAdd={onAdd} onRemove={onRemove} />, parent);
  }
};

let definedAttributes: string[] = [];
let attributeObserver: MutationObserver;
const updateAttributeObserver = () => {
  if (attributeObserver) {
    attributeObserver.disconnect();
  }
  attributeObserver = createHTMLObserver({
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
};
const unloads = new Set<() => void>();
export const toggleFeature = async (flag: boolean) => {
  if (flag) {
    definedAttributes = getDefinedAttributes();
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
            onAdd: (attr: string) => {
              definedAttributes.push(attr);
              updateAttributeObserver();
            },
            onRemove: (attr: string) => {
              definedAttributes = definedAttributes.filter((a) => a !== attr);
              updateAttributeObserver();
            },
          });
        }
      },
    });

    updateAttributeObserver();

    unloads.add(() => {
      observer.disconnect();
      attributeObserver.disconnect();
    });
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
