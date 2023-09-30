import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  HTMLTable,
  EditableText,
  NumericInput,
  Checkbox,
  Button,
  Card,
  Elevation,
  FormGroup,
  RadioGroup,
  Radio,
  MenuItem,
  Popover,
  Menu,
  MenuDivider,
  Divider,
} from "@blueprintjs/core";
import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import createBlock from "roamjs-components/writes/createBlock";
import updateBlock from "roamjs-components/writes/updateBlock";
import { createComponentRender } from "roamjs-components/components/ComponentContainer";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import addStyle from "roamjs-components/dom/addStyle";
import getSubTree from "roamjs-components/util/getSubTree";
import getUids from "roamjs-components/dom/getUids";
import setInputSetting from "roamjs-components/util/setInputSetting";
import setInputSettings from "roamjs-components/util/setInputSettings";

type ConfigurationProps = {
  blockUid: string;
  onSubmit: () => void;
};

type DisplayTableProps = {
  blockUid: string;
  setIsEdit: (isEdit: boolean) => void;
};

type StyleOptionsType = {
  striped: boolean;
  bordered: boolean;
  condensed: boolean;
  interactive: boolean;
};

const getSettings = (blockUid: string) => {
  const parentUid = blockUid;
  const tree = getBasicTreeByParentUid(blockUid);
  const headerNode = getSubTree({ tree, key: "header", parentUid });
  const rowsNode = getSubTree({ tree, key: "rows", parentUid });
  const optionsNode = getSubTree({ tree, key: "options", parentUid });
  const stylesNode = getSubTree({
    tree: optionsNode.children,
    key: "styles",
    parentUid: optionsNode.uid,
  });
  const viewNode = getSubTree({
    tree: optionsNode.children,
    key: "view",
    parentUid: optionsNode.uid,
  });
  const view = viewNode.children[0]?.text;
  const isEditing = tree.some((c) => c.text.toLowerCase() === "editing");

  const styles = {
    striped: stylesNode.children.some(
      (c) => c.text.toLowerCase() === "striped"
    ),
    bordered: stylesNode.children.some(
      (c) => c.text.toLowerCase() === "bordered"
    ),
    condensed: stylesNode.children.some(
      (c) => c.text.toLowerCase() === "condensed"
    ),
    interactive: stylesNode.children.some(
      (c) => c.text.toLowerCase() === "interactive"
    ),
  };

  return {
    tree,
    headerNode,
    rowsNode,
    optionsNode,
    stylesNode,
    isEditing,
    styles,
    viewNode,
    view,
  };
};
const Configuration = ({ blockUid, onSubmit }: ConfigurationProps) => {
  const settings = getSettings(blockUid);
  const {
    headerNode,
    rowsNode,
    optionsNode,
    styles,
    view: initialView,
  } = settings;

  const initialNumHeaders = headerNode.children.length;
  const initialNumRows = rowsNode.children.length;
  const firstLoad = !initialNumHeaders && !initialNumRows;
  const [isCreatingBlocks, setIsCreatingBlocks] = useState(false);
  const [numRows, setNumRows] = useState(3);
  const [numCols, setNumCols] = useState(3);
  const [view, setView] = useState(initialView || "plain");
  const [styleOptions, setStyleOptions] = useState(
    firstLoad
      ? { striped: true, bordered: false, condensed: false, interactive: false }
      : styles
  );

  const createHeaderNode = async (numHeaders: number) => {
    if (initialNumHeaders) return;
    const headers = Array.from({ length: numHeaders }, (_, i) => ({
      text: `Header ${i + 1}`,
    }));
    await Promise.all(
      headers.map((child) => {
        createBlock({
          node: {
            text: child.text,
          },
          parentUid: headerNode.uid,
        });
      })
    );
  };
  const createRowsNode = async (numHeaders: number, numRows: number) => {
    if (initialNumRows) return;
    const rows = Array.from({ length: numRows }, (_, i) => ({
      text: `row${i + 1}`,
      children: Array.from({ length: numHeaders }, () => ({ text: "" })),
    }));
    await Promise.all(
      rows.map((child) =>
        createBlock({
          node: {
            text: child.text,
            children: child.children,
          },
          parentUid: rowsNode.uid,
        })
      )
    );
  };

  const setOptions = async (styleOptions: StyleOptionsType, view: string) => {
    setInputSettings({
      blockUid: optionsNode.uid,
      key: "styles",
      values: Object.entries(styleOptions)
        .filter(([_, value]) => value)
        .map(([key, value]) => (value ? key : "")),
    });
    await setInputSetting({
      blockUid: optionsNode.uid,
      key: "view",
      value: view,
    });
  };
  const handleStylesChange = (
    e: React.FormEvent<HTMLInputElement>,
    option: string
  ) => {
    const value = (e.target as HTMLInputElement).checked;
    setStyleOptions((prevOptions) => ({
      ...prevOptions,
      [option]: value,
    }));
  };

  const handleSubmit = async () => {
    await Promise.all([
      createHeaderNode(numCols),
      createRowsNode(numCols, numRows),
      setOptions(styleOptions, view),
    ]);

    // fold {{wb-table}} block
    window.roamAlphaAPI.data.block.update({
      block: { uid: blockUid, open: false },
    });
  };

  return (
    <div className="roamjs-workbench-table-config" style={{ width: "215px" }}>
      <Card interactive={true} elevation={Elevation.ZERO} className="p-8">
        {firstLoad && (
          <>
            <FormGroup
              label="Rows"
              labelFor="rows-input"
              inline={true}
              className="roamjs-input-label"
            >
              <NumericInput
                id="rows-input"
                type="number"
                defaultValue={numRows}
                onValueChange={(value) => setNumRows(value)}
                style={{ width: "50px" }}
              />
            </FormGroup>
            <FormGroup
              label="Columns"
              labelFor="cols-input"
              inline={true}
              className="roamjs-input-label"
            >
              <NumericInput
                id="cols-input"
                type="number"
                defaultValue={numCols}
                onValueChange={(value) => setNumCols(value)}
                style={{ width: "50px" }}
              />
            </FormGroup>
            <Divider className="my-3" />
          </>
        )}
        <div className="flex flex-col">
          {Object.entries(styleOptions).map(([key, value], index) => (
            <div key={index}>
              <Checkbox
                alignIndicator={"right"}
                checked={value}
                label={key}
                onChange={(e) => handleStylesChange(e, key)}
                className="capitalize"
              />
            </div>
          ))}
        </div>
        <Divider className="mb-3 mt-0" />
        <RadioGroup
          onChange={(e) => setView((e.target as HTMLInputElement).value)}
          selectedValue={view}
        >
          <Radio label="Basic Text" value="plain" alignIndicator="right" />
          <Radio label="Embed" value="embed" alignIndicator="right" />
        </RadioGroup>
        <div className="text-center mt-8">
          <Button
            loading={isCreatingBlocks}
            text={firstLoad ? "Create Table" : "Update Settings"}
            onClick={async () => {
              setIsCreatingBlocks(true);
              await handleSubmit();
              onSubmit();
              setIsCreatingBlocks(false);
            }}
            intent={"primary"}
          />
        </div>
      </Card>
    </div>
  );
};
const DisplayTable = ({ blockUid, setIsEdit }: DisplayTableProps) => {
  const [settings, setSettings] = useState(() => getSettings(blockUid));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateText = (uid: string, value: string) => {
    updateBlock({ uid, text: value });
  };
  function sanitizeClassName(text: string) {
    text = text.length > 20 ? text.substring(0, 20) : text;
    return text.replace(/[^a-zA-Z0-9-_]/g, "-");
  }
  const CellEmbed = ({ uid }: { uid: string }) => {
    const contentRef = useRef(null);
    useEffect(() => {
      const el = contentRef.current;
      if (el) {
        window.roamAlphaAPI.ui.components.renderBlock({
          uid,
          el,
        });
      }
    }, [contentRef]);
    return <div className="roamjs-table-embed" ref={contentRef}></div>;
  };
  const TableMenu = () => {
    return (
      <Popover
        enforceFocus={false}
        autoFocus={false}
        isOpen={isMenuOpen}
        target={<Button minimal icon={"more"} />}
        onInteraction={(v) => {
          setIsMenuOpen(v);
        }}
        content={
          <Menu>
            <MenuItem icon={"add"} text={"Add"}>
              <MenuItem
                icon={"add-row-bottom"}
                text={"Add Row"}
                onClick={async () => {
                  if (!settings.rowsNode.uid) return;
                  await createBlock({
                    node: {
                      text: `row${settings.rowsNode.children.length + 1}`,
                      children: Array.from(
                        { length: settings.headerNode.children.length },
                        () => ({ text: "" })
                      ),
                    },
                    order: "last",
                    parentUid: settings.rowsNode.uid,
                  });
                  setSettings(getSettings(blockUid));
                }}
              />
              <MenuItem
                icon={"add-column-right"}
                text={"Add Column"}
                onClick={async () => {
                  if (!settings.headerNode.uid) return;
                  await createBlock({
                    node: {
                      text: `Header ${settings.headerNode.children.length + 1}`,
                    },
                    order: "last",
                    parentUid: settings.headerNode.uid,
                  });
                  for (const row of settings.rowsNode.children) {
                    await createBlock({
                      order: "last",
                      node: {
                        text: "",
                      },

                      parentUid: row.uid,
                    });
                  }
                  setSettings(getSettings(blockUid));
                }}
              />
            </MenuItem>
            <MenuItem icon={"remove"} text={"Remove"}>
              <MenuItem
                icon={"remove-row-bottom"}
                text={"Remove Last Row"}
                onClick={async () => {
                  if (!settings.rowsNode.uid) return;
                  const lastRow =
                    settings.rowsNode.children[
                      settings.rowsNode.children.length - 1
                    ];
                  await window.roamAlphaAPI.deleteBlock({
                    block: { uid: lastRow.uid },
                  });
                  setSettings(getSettings(blockUid));
                }}
              />
              <MenuItem
                icon={"remove-column-right"}
                text={"Remove Last Column"}
                onClick={async () => {
                  if (!settings.headerNode.uid) return;
                  const lastHeader =
                    settings.headerNode.children[
                      settings.headerNode.children.length - 1
                    ];
                  await window.roamAlphaAPI.deleteBlock({
                    block: { uid: lastHeader.uid },
                  });
                  for (const row of settings.rowsNode.children) {
                    const lastCell = row.children[row.children.length - 1];
                    await window.roamAlphaAPI.deleteBlock({
                      block: { uid: lastCell.uid },
                    });
                  }
                  setSettings(getSettings(blockUid));
                }}
              />
            </MenuItem>
            <MenuDivider />
            <MenuItem
              icon={"cog"}
              text={"Settings"}
              onClick={() => setIsEdit(true)}
            />
            <MenuItem
              icon={"edit"}
              text={"Edit Block"}
              onClick={() => {
                const location = getUids(
                  containerRef.current?.closest(".roam-block") as HTMLDivElement
                );
                window.roamAlphaAPI.ui.setBlockFocusAndSelection({
                  location: {
                    "window-id": location.windowId,
                    "block-uid": location.blockUid,
                  },
                });
              }}
            />
          </Menu>
        }
      />
    );
  };
  return (
    <div className="relative" ref={containerRef}>
      <span className="absolute top-1 right-0">
        <TableMenu />
      </span>
      <HTMLTable
        className={`roamjs-workbench-table table-fixed w-full pointer-events-auto ${
          settings.view === "plain" ? "basic-text" : ""
        }`}
        bordered={settings.styles.bordered}
        condensed={settings.styles.condensed}
        interactive={settings.styles.interactive}
        striped={settings.styles.striped}
      >
        <thead>
          <tr>
            {!!settings.headerNode.children.length &&
              settings.headerNode.children.map((c) => (
                <th
                  key={c.uid}
                  className={`wbt-header-${sanitizeClassName(c.text)}`}
                >
                  {settings.view === "embed" ? (
                    <CellEmbed uid={c.uid} />
                  ) : (
                    <EditableText
                      placeholder=""
                      defaultValue={c.text}
                      onConfirm={(value) => updateText(c.uid, value)}
                    />
                  )}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {!!settings.rowsNode.children.length &&
            settings.rowsNode.children.map((c) => (
              <tr
                key={c.uid}
                className={`wbt-row-${sanitizeClassName(c.text)} w-full`}
              >
                {c.children.map((c) => (
                  <td key={c.uid} className="overflow-hidden">
                    {settings.view === "embed" ? (
                      <CellEmbed uid={c.uid} />
                    ) : (
                      <EditableText
                        placeholder=""
                        defaultValue={c.text}
                        onConfirm={(value) => updateText(c.uid, value)}
                        className={`wbt-cell-${sanitizeClassName(
                          c.text
                        )} w-full`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </HTMLTable>
    </div>
  );
};

const Table = ({ blockUid }: { blockUid: string }): JSX.Element => {
  const tree = useMemo(() => getBasicTreeByParentUid(blockUid), [blockUid]);
  const rowsNode = useMemo(() => getSubTree({ tree, key: "rows" }), [tree]);
  const headerNode = useMemo(() => getSubTree({ tree, key: "header" }), [tree]);

  const [isEdit, setIsEdit] = useState(
    !headerNode.children.length || !rowsNode.children.length
  );

  return isEdit ? (
    <Configuration blockUid={blockUid} onSubmit={() => setIsEdit(false)} />
  ) : (
    <DisplayTable blockUid={blockUid} setIsEdit={setIsEdit} />
  );
};

const unloads = new Set<() => void>();
export const toggleFeature = (flag: boolean) => {
  if (flag) {
    const tableButtonObserver = createButtonObserver({
      attribute: "wb-table",
      render: (b: HTMLButtonElement) => {
        createComponentRender(
          ({ blockUid }) => <Table blockUid={blockUid} />,
          "roamjs-workbench-table-parent"
        )(b);
      },
    });
    addStyle(`
      /* Chrome, Safari, Edge, Opera */
      .roamjs-workbench-table-config input::-webkit-outer-spin-button,
      .roamjs-workbench-table-config input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    
      /* Firefox */
      .roamjs-workbench-table-config input[type=number] {
        -moz-appearance: textfield;
      }

      .roamjs-workbench-table-config .roamjs-input-label label {
        min-width: 70px;
      }
      .roamjs-workbench-table.basic-text td {
        user-select: none;
        pointer-events: none;
      }
      .roamjs-workbench-table.basic-text input,
      .roamjs-workbench-table.basic-text span
       {
        pointer-events: auto;
        width: 100%;
      }
      .roamjs-workbench-table .rm-block-separator,
      .roamjs-workbench-table-parent .roamjs-edit-component {
        display: none;
      }
    `);
    unloads.add(() => tableButtonObserver.disconnect());
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
