import React, { useEffect, useMemo, useRef, useState, ReactText } from "react";
import ReactDOM from "react-dom";
import {
  Classes,
  Button,
  Tabs,
  Tab,
  Card,
  MenuItem,
  FormGroup,
  Label,
  NumericInput,
  Slider,
  Popover,
} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getBlockUidFromTarget from "roamjs-components/dom/getBlockUidFromTarget";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import createBlock from "roamjs-components/writes/createBlock";
import { InputTextNode, PullBlock } from "roamjs-components/types";
import getSubTree from "roamjs-components/util/getSubTree";
import updateBlock from "roamjs-components/writes/updateBlock";
import deleteBlock from "roamjs-components/writes/deleteBlock";
import createPage from "roamjs-components/writes/createPage";
import MenuItemSelect from "roamjs-components/components/MenuItemSelect";
import addStyle from "roamjs-components/dom/addStyle";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import { render as renderToast } from "roamjs-components/components/Toast";
import setInputSetting from "roamjs-components/util/setInputSetting";
import setInputSettings from "roamjs-components/util/setInputSettings";
import getSettingValueFromTree from "roamjs-components/util/getSettingValueFromTree";

const CONFIG = `roam/js/attribute-select`;

type AttributeButtonPopoverProps<T> = {
  items: T[];
  onItemSelect?: (selectedItem: T) => void;
  setIsOpen: (isOpen: boolean) => void;
  attributeName: string;
  uid: string;
  currentValue: string;
  filterable?: boolean;
  isOpen: boolean;
};

const AttributeButtonPopover = <T extends ReactText>({
  items,
  setIsOpen,
  attributeName,
  uid,
  currentValue,
  filterable = false,
  isOpen,
}: AttributeButtonPopoverProps<T>) => {
  const itemPredicate = (query: string, item: T) => {
    return String(item).toLowerCase().includes(query.toLowerCase());
  };
  const [sliderValue, setSliderValue] = useState(0);
  useEffect(() => {
    setSliderValue(Number(currentValue));
  }, [isOpen, currentValue]);

  const formatDisplayText = (text: string): string => {
    // TODO: for doantrang982/eng-77-decouple-display-from-output: Create formatDisplayText from configPage
    // const match = text.match(/\[\[(.*?)\]\]/);
    // if (match && match[1]) {
    //   return match[1];
    // }
    return text;
  };

  // Only show filter if we have more than 10 items
  const shouldFilter = filterable && items.length > 10;

  return (
    <MenuItemSelect
      className="inline-menu-item-select"
      itemPredicate={itemPredicate}
      items={items}
      activeItem={currentValue as T}
      filterable={shouldFilter}
      // transformItem={(item) => formatDisplayText(String(item))}
      onItemSelect={(s) => {
        updateBlock({
          text: `${attributeName}:: ${s}`,
          uid,
        });
        setIsOpen(false);
      }}
      popoverProps={{
        isOpen,
        onClose: () => setIsOpen(false),
      }}
    >
      {() => (
        <Button
          className="roamjs-attribute-select-button p-0 ml-1"
          icon="chevron-down"
          style={{ minHeight: 15, minWidth: 20 }}
          intent="primary"
          minimal
          onClick={() => setIsOpen(true)}
        />
      )}
    </MenuItemSelect>
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
  const [currentValue, setCurrentValue] = useState("");

  const configUid = getPageUidByPageTitle(CONFIG);
  const attributesNode = getSubTree({
    key: "attributes",
    parentUid: configUid,
  });
  const attributeUid = getSubTree({
    key: attributeName,
    parentUid: attributesNode.uid,
  }).uid;
  const optionType =
    getSettingValueFromTree({
      key: "type",
      parentUid: attributeUid,
    }) || "text";

  useEffect(() => {
    if (!isOpen) return;
    const optionsNode = getSubTree({
      key: "options",
      parentUid: attributeUid,
    });
    const rangeNode = getSubTree({
      key: "range",
      parentUid: attributeUid,
    });
    const useSmartBlocks =
      optionsNode.children.filter((obj) => obj.text.includes("<%")).length > 0;

    if (optionType === "number") {
      setOptions([rangeNode.children[0]?.text, rangeNode.children[1]?.text]);
    }
    if (optionType === "text") {
      if (useSmartBlocks && !window.roamjs?.extension?.smartblocks) {
        renderToast({
          content:
            "This attribute requires SmartBlocks. Enable SmartBlocks in Roam Depot to use this template.",
          id: "smartblocks-extension-disabled",
          intent: "warning",
        });
        setOptions(optionsNode.children.map((t) => t.text));
      } else if (useSmartBlocks && window.roamjs?.extension?.smartblocks) {
        window.roamjs.extension.smartblocks
          .triggerSmartblock({
            srcUid: optionsNode.uid,
          })
          .then((r) => {
            const results = r as InputTextNode[];
            setOptions(results.map((t) => t.text) || []);
          });
      } else {
        setOptions(optionsNode.children.map((t) => t.text));
      }
    }
    const regex = new RegExp(`^${attributeName}::\\s*`);
    setCurrentValue(getTextByBlockUid(uid).replace(regex, "").trim());
  }, [isOpen]);
  const [sliderValue, setSliderValue] = useState(0);
  useEffect(() => {
    setSliderValue(Number(currentValue));
  }, [isOpen, currentValue]);
  const min = Number(options[0]) || 0;
  const max = Number(options[1]) || 10;
  return (
    <>
      {optionType === "number" ? (
        <Popover
          isOpen={!!options.length && isOpen}
          popoverClassName="bp3-select-popover"
          position="bottom"
          content={
            <Slider
              value={sliderValue}
              min={min}
              max={max}
              className="w-64 my-2 mx-4"
              onChange={(value) => setSliderValue(value)}
              onRelease={(s) => {
                updateBlock({
                  text: `${attributeName}:: ${s}`,
                  uid,
                });
                setIsOpen(false);
              }}
            />
          }
          target={
            <Button
              className="roamjs-attribute-select-button p-0 ml-1"
              icon="chevron-down"
              style={{ minHeight: 15, minWidth: 20 }}
              intent="primary"
              minimal
              onClick={() => setIsOpen(true)}
            />
          }
          onClose={() => setIsOpen(false)}
        />
      ) : (
        <AttributeButtonPopover
          setIsOpen={setIsOpen}
          items={options}
          attributeName={attributeName}
          uid={uid}
          currentValue={currentValue}
          isOpen={isOpen}
          filterable={true}
        />
      )}
    </>
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
  const [attributesInGraph, setAttributesInGraph] = useState<string[]>([]);
  const [noAttributesInGraph, setNoAttributesInGraph] = useState(false);
  const getAttributesInGraph = async () => {
    const results =
      // @ts-ignore
      (await window.roamAlphaAPI.data.backend.q(
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
      )) as [PullBlock][];
    const attributesInGraph = results.map((p) => p[0]?.[":node/title"] || "");
    if (attributesInGraph.length === 0) {
      setNoAttributesInGraph(true);
    } else {
      setAttributesInGraph(attributesInGraph);
      setNoAttributesInGraph(false);
    }
  };
  const focusAndOpenSelect = () => {
    const selectElement = document.querySelector(
      ".attribute-select-autocomplete-select button"
    ) as HTMLElement;
    if (selectElement) selectElement.click();
  };
  const focusOnBlock = (uid: string) => {
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
        children: [
          { text: "options", children: [{ text: "" }] },
          { text: "range", children: [] },
        ],
      },
      order: "last",
      parentUid: attributesUid,
    });

    setDefinedAttributes([...definedAttributes, value]);
    setActiveTab(value);
    setValue("");
    onAdd(value);
    setQuery("");

    focusOnBlock(uid);
  };

  return (
    <div className={`${Classes.DIALOG_BODY} m-0`}>
      <div className="flex mb-8 items-center">
        {attributesInGraph.length > 0 ? (
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
                className="attribute-select-autocomplete-select"
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
              text={"Add Attribute"}
              rightIcon={"plus"}
              loading={isLoading}
              onClick={() => {
                setIsLoading(true);
                setTimeout(async () => {
                  await getAttributesInGraph();

                  setIsLoading(false);
                  focusAndOpenSelect();
                }, 0);
              }}
            />
            <div className="text-gray-500 ml-2">
              {isLoading ? "Loading Attributes..." : ""}
              {noAttributesInGraph ? "No Attributes Found" : ""}
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
  const { attributeUid, optionsNode, chosenOptions, rangeNode } =
    useMemo(() => {
      const attributeUid = getSubTree({
        key: attributeName,
        parentUid: attributesUid,
      }).uid;
      const optionsNode = getSubTree({
        key: "options",
        parentUid: attributeUid,
      });
      const chosenOptions = optionsNode.children.map((t) => t.text);
      const rangeNode = getSubTree({
        key: "range",
        parentUid: attributeUid,
      });
      return { attributeUid, optionsNode, chosenOptions, rangeNode };
    }, [attributeName, attributesUid]);
  const initialOptionType = useMemo(
    () =>
      getSettingValueFromTree({
        key: "type",
        parentUid: attributeUid,
      }),
    [attributeUid]
  );
  const [optionType, setOptionType] = useState(initialOptionType || "text");
  const [min, setMin] = useState(Number(rangeNode.children[0]?.text) || 0);
  const [max, setMax] = useState(Number(rangeNode.children[1]?.text) || 10);

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
  }, [contentRef, optionType]);

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
    <>
      <div className="relative flex">
        {optionType === "text" ? (
          <div
            ref={contentRef}
            className={`flex-1 attribute-${attributeUid}`}
          />
        ) : optionType === "number" ? (
          <>
            <div className="flex-1">
              <FormGroup inline={true}>
                <Label>{"Min"}</Label>
                <NumericInput
                  value={min}
                  onValueChange={(value) => {
                    setMin(value);
                    setInputSettings({
                      blockUid: attributeUid,
                      values: [String(value), String(max)],
                      key: "range",
                    });
                  }}
                />
              </FormGroup>
              <FormGroup inline={true}>
                <Label>Max</Label>
                <NumericInput
                  value={max}
                  onValueChange={(value) => {
                    setMax(value);
                    setInputSettings({
                      blockUid: attributeUid,
                      values: [String(min), String(value)],
                      key: "range",
                    });
                  }}
                />
              </FormGroup>
            </div>
          </>
        ) : (
          "Error"
        )}
        <div className="flex flex-col items-start flex-1 space-y-4 mx-2">
          <FormGroup label={"Type"} inline={true} className="m-0">
            <MenuItemSelect
              items={["text", "number"]}
              onItemSelect={(value) => {
                setOptionType(value);
                setInputSetting({
                  blockUid: attributeUid,
                  key: "type",
                  value,
                });
                setShowPotentialOptions(false);
              }}
              activeItem={optionType}
            />
          </FormGroup>

          {optionType === "text" && (
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
          )}
          <div
            className="flex items-start space-x-4"
            style={{ minHeight: "40px" }}
          >
            {showPossibleOptions && (
              <>
                {!potentialOptions.length && (
                  <div className="text-gray-500">
                    No additional values found
                  </div>
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
                        const updatedOptionNode = getSubTree({
                          key: "options",
                          parentUid: attributeUid,
                        });
                        const updatedChosenOptions =
                          updatedOptionNode.children.map((t) => t.text);
                        if (
                          updatedChosenOptions.length === 1 &&
                          updatedChosenOptions[0] === ""
                        ) {
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
              </>
            )}
          </div>
          <div style={{ marginTop: "10rem" }}>
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
          </div>
        </div>
      </div>
    </>
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
    addStyle(`
      .inline-menu-item-select > span > div {display:inline} 
      #attribute-select-config .rm-block-separator {display: none;}
    `);
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

    window.roamjs.extension.workbench = {
      refreshAttributeSelect: () => {
        definedAttributes = getDefinedAttributes();
        updateAttributeObserver();
      },
    };

    unloads.add(() => {
      observer.disconnect();
      attributeObserver.disconnect();
    });
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
    if (window.roamjs?.extension?.workbench?.refreshAttributeSelect) {
      delete window.roamjs.extension.workbench.refreshAttributeSelect;
    }
  }
};
