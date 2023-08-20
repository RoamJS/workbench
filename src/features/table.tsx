import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
} from "@blueprintjs/core";
import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import createBlock from "roamjs-components/writes/createBlock";
import updateBlock from "roamjs-components/writes/updateBlock";
import { createComponentRender } from "roamjs-components/components/ComponentContainer";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import { RoamBasicNode } from "roamjs-components/types";
import addStyle from "roamjs-components/dom/addStyle";
import getSubTree from "roamjs-components/util/getSubTree";
import deleteBlock from "roamjs-components/writes/deleteBlock";

type ConfigurationProps = {
  blockUid: string;
  onSubmit: () => void;
};

type Settings = {
  tree: RoamBasicNode[];
  headerNode: RoamBasicNode;
  rowsNode: RoamBasicNode;
  optionsNode: RoamBasicNode;
  stylesNode: RoamBasicNode;
  isEditing: boolean;
  options: {
    striped: boolean;
    bordered: boolean;
    condensed: boolean;
    interactive: boolean;
  };
};

//
// TODO
// FIX THE EDIT/LOADING MESS
//

const getSettings = (blockUid: string) => {
  const tree = getBasicTreeByParentUid(blockUid);
  const headerNode = getSubTree({ tree, key: "header" });
  const rowsNode = getSubTree({ tree, key: "rows" });
  const optionsNode = getSubTree({ tree, key: "options" });
  const stylesNode = getSubTree({
    tree: optionsNode.children,
    key: "styles",
  });
  const viewNode = getSubTree({ tree: optionsNode.children, key: "view" });
  const setView = viewNode.children[0]?.text;
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
    setView,
  };
};
const Configuration = ({ blockUid, onSubmit }: ConfigurationProps) => {
  const [isCreatingBlocks, setIsCreatingBlocks] = useState(false);
  const [numRows, setNumRows] = useState(3);
  const [numCols, setNumCols] = useState(3);
  const [initialView, setInitialView] = useState("plain");
  const [initialStyles, setInitialStyleOptions] = useState({
    striped: true,
    bordered: false,
    condensed: false,
    interactive: false,
  });

  const createHeaderNode = async (numHeaders: number) => {
    const headerUid = window.roamAlphaAPI.util.generateUID();
    const children = Array.from({ length: numHeaders }, (_, i) => ({
      text: `Header ${i + 1}`,
    }));
    await createBlock({
      node: {
        text: "header",
        uid: headerUid,
        children,
      },
      parentUid: blockUid,
    });
    return getBasicTreeByParentUid(headerUid);
  };
  const createRowsNode = async (numHeaders: number, numRows: number) => {
    const rowUid = window.roamAlphaAPI.util.generateUID();
    const children = Array.from({ length: numRows }, (_, i) => ({
      text: `row${i + 1}`,
      children: Array.from({ length: numHeaders }, () => ({ text: "" })),
    }));
    await createBlock({
      node: {
        text: "rows",
        uid: rowUid,
        children,
      },
      parentUid: blockUid,
    });
    return getBasicTreeByParentUid(rowUid);
  };
  const createOptionsNode = async (options: {}, initialView: string) => {
    const optionsUid = window.roamAlphaAPI.util.generateUID();
    const children = Object.entries(options).map(([key, value]) => ({
      text: value ? key : "",
    }));
    await createBlock({
      node: {
        text: "options",
        uid: optionsUid,
        children: [
          {
            text: "styles",
            children,
          },
          {
            text: "view",
            children: [
              {
                text: initialView,
              },
            ],
          },
        ],
      },
      parentUid: blockUid,
    });
    return getBasicTreeByParentUid(optionsUid);
  };

  const handleStyles = (
    e: React.FormEvent<HTMLInputElement>,
    option: string
  ) => {
    const value = (e.target as HTMLInputElement).checked;
    setInitialStyleOptions((prevOptions) => ({
      ...prevOptions,
      [option]: value,
    }));
  };

  const createTableNodes = async () => {
    // create initial config
    createHeaderNode(numCols);
    createRowsNode(numCols, numRows);
    createOptionsNode(initialStyles, initialView);

    // fold {{wb-table}} block on first create
    // window.roamAlphaAPI.data.block.update({
    //   block: { uid: blockUid, open: false },
    // });
  };

  return (
    <div className="roamjs-workbench-table-config" style={{ width: "215px" }}>
      <Card interactive={true} elevation={Elevation.ZERO} className="p-8">
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
        <div className="flex flex-col">
          {Object.entries(initialStyles).map(([key, value], index) => (
            <div className="px-2" key={index}>
              <Checkbox
                alignIndicator={"right"}
                checked={value}
                label={key}
                onChange={(e) => handleStyles(e, key)}
                className="capitalize"
              />
            </div>
          ))}
        </div>

        <RadioGroup
          onChange={(e) => setInitialView((e.target as HTMLInputElement).value)}
          selectedValue={initialView}
        >
          <Radio label="Basic Text" value="plain" />
          <Radio label="Embed" value="embed" />
        </RadioGroup>

        <div className="text-right mt-4">
          <Button
            loading={isCreatingBlocks}
            text="Create Table"
            onClick={() => {
              setIsCreatingBlocks(true);
              createTableNodes();

              // TODO FIX THIS
              setTimeout(() => {
                onSubmit();
                setIsCreatingBlocks(false);
              }, 1000);
            }}
            intent={"primary"}
          />
        </div>
      </Card>
    </div>
  );
};

const Table = ({ blockUid }: { blockUid: string }): JSX.Element => {
  // What is this doing?
  const [loading, setLoading] = useState(true);
  // Need to trigger this again after config is submitted
  const settings = useMemo(() => getSettings(blockUid), [blockUid, loading]);
  const [isEdit, _setIsEdit] = useState(settings.isEditing);
  const [hasData, setHasData] = useState(() => {
    return (
      settings.headerNode.children.length > 0 &&
      settings.rowsNode.children.length > 0
    );
  });
  const setIsEdit = useCallback(
    (b: boolean) => {
      _setIsEdit(b);
      return b
        ? createBlock({
            parentUid: blockUid,
            node: { text: "editing" },
          })
        : // this is not triggering on intital config submit
          deleteBlock(getSubTree({ parentUid: blockUid, key: "editing" }).uid);
    },
    [blockUid]
  );
  useEffect(() => {
    console.log(
      `useEffect: edit: ${isEdit}, loading: ${loading}, data:${hasData}`
    );
    if (!isEdit) {
      if (hasData) {
        setLoading(false);
      } else {
        setIsEdit(true);
      }
    }
  }, [isEdit, setLoading, setIsEdit, hasData]);

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
      console.log(`useEffect: CellEmbed: ${uid}, el ${el}`);
      if (el) {
        window.roamAlphaAPI.ui.components.renderBlock({
          uid,
          el,
        });
      }
    }, [contentRef]);
    return (
      <div className="roamjs-table-embed">
        <div ref={contentRef} />
      </div>
    );
  };

  return isEdit && loading ? (
    <Configuration
      blockUid={blockUid}
      onSubmit={() => {
        // TODO FIX THIS
        setIsEdit(false);
        setTimeout(() => {
          setHasData(true);
          setLoading(false);
        }, 1000);
        console.log(`onsubmit`);
      }}
    />
  ) : (
    <HTMLTable
      className={`roamjs-workbench-table table-fixed w-full pointer-events-auto ${
        settings.setView === "plain" ? "basic-text" : ""
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
                {settings.setView === "plain" ? (
                  <EditableText
                    placeholder=""
                    defaultValue={c.text}
                    onConfirm={(value) => updateText(c.uid, value)}
                  />
                ) : (
                  <CellEmbed uid={c.uid} />
                )}
              </th>
            ))}
        </tr>
      </thead>
      <tbody>
        {!!settings.rowsNode.children.length &&
          settings.rowsNode.children.map((c) => (
            <tr key={c.uid} className={`wbt-row-${sanitizeClassName(c.text)}`}>
              {c.children.map((c) => (
                <td key={c.uid}>
                  {settings.setView === "plain" ? (
                    <EditableText
                      placeholder=""
                      defaultValue={c.text}
                      onConfirm={(value) => updateText(c.uid, value)}
                      className={`wbt-cell-${sanitizeClassName(c.text)} w-full`}
                    />
                  ) : (
                    <CellEmbed uid={c.uid} />
                  )}
                </td>
              ))}
            </tr>
          ))}
      </tbody>
    </HTMLTable>
  );
};

const unloads = new Set<() => void>();
export const toggleFeature = (flag: boolean) => {
  if (flag) {
    const tableButtonObserver = createButtonObserver({
      attribute: "wb-table",
      render: (b: HTMLButtonElement) => {
        createComponentRender(Table)(b);
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
      }
    `);
    unloads.add(() => tableButtonObserver.disconnect());
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
