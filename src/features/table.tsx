import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  HTMLTable,
  EditableText,
  NumericInput,
  Checkbox,
  Button,
  Card,
  Elevation,
  FormGroup,
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

//
// TODO
// FIX THE EDIT/LOADING MESS
//
// ADD LOADING DIV
//

const Configuration = ({ blockUid, onSubmit }: ConfigurationProps) => {
  const [numRows, setNumRows] = useState(3);
  const [numCols, setNumCols] = useState(3);
  const [options, setLocalOptions] = useState({
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
  const createOptionsNode = async (options: {}) => {
    const optionsUid = window.roamAlphaAPI.util.generateUID();
    const children = Object.entries(options).map(([key, value]) => ({
      text: value ? key : "",
    }));
    await createBlock({
      node: {
        text: "options",
        uid: optionsUid,
        children,
      },
      parentUid: blockUid,
    });
    return getBasicTreeByParentUid(optionsUid);
  };

  const handleOptionsConfig = (
    e: React.FormEvent<HTMLInputElement>,
    option: string
  ) => {
    const value = (e.target as HTMLInputElement).checked;
    setLocalOptions((prevOptions) => ({
      ...prevOptions,
      [option]: value,
    }));
  };

  const createTableNodes = async () => {
    // create initial config
    createHeaderNode(numCols);
    createRowsNode(numCols, numRows);
    createOptionsNode(options);

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
        <div className="flex flex-column">
          {Object.entries(options).map(([key, value], index) => (
            <div className="px-2" key={index}>
              <Checkbox
                alignIndicator={"right"}
                checked={value}
                label={key}
                onChange={(e) => handleOptionsConfig(e, key)}
                className="capitalize"
              />
            </div>
          ))}
        </div>
        <div className="text-right mt-4">
          <Button
            text="Create Table"
            onClick={() => {
              createTableNodes();
              onSubmit();
            }}
            intent={"primary"}
          />
        </div>
      </Card>
    </div>
  );
};

const Table = ({ blockUid }: { blockUid: string }): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [headerNodes, setHeaderNodes] = useState<RoamBasicNode[]>([]);
  const [rowsNodes, setRowsNodes] = useState<RoamBasicNode[]>([]);
  const [options, setOptions] = useState<{
    striped?: boolean;
    bordered?: boolean;
    condensed?: boolean;
    interactive?: boolean;
  }>({});

  const tree = useMemo(() => getBasicTreeByParentUid(blockUid), [blockUid]);
  const [isEdit, _setIsEdit] = useState(
    () => !!getSubTree({ tree, key: "editing" }).uid
  );
  const [hasData, setHasData] = useState(() => {
    const headerNodesExist = tree.some(
      (c) => c.text.toLowerCase() === "header"
    );
    const rowsNodesExist = tree.some((c) => c.text.toLowerCase() === "rows");
    const optionsNodesExist = tree.some(
      (c) => c.text.toLowerCase() === "options"
    );
    return headerNodesExist && rowsNodesExist && optionsNodesExist;
  });
  const setIsEdit = useCallback(
    (b: boolean) => {
      _setIsEdit(b);
      return b
        ? createBlock({
            parentUid: blockUid,
            node: { text: "editing" },
            order: 2,
          })
        : deleteBlock(getSubTree({ parentUid: blockUid, key: "editing" }).uid);
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
        console.log("set loading to false");
      } else {
        setIsEdit(true);
        console.log("set edit to true");
      }
    }
  }, [isEdit, setLoading, setIsEdit, hasData]);
  const fetchData = async (tree: RoamBasicNode[]) => {
    // check if header, rows, options nodes exist
    const headerNodesExist = tree.some(
      (c) => c.text.toLowerCase() === "header"
    );
    const rowsNodesExist = tree.some((c) => c.text.toLowerCase() === "rows");
    const optionsNodesExist = tree.some(
      (c) => c.text.toLowerCase() === "options"
    );

    // if header, rows, options nodes don't exist, exit
    if (!headerNodesExist || !rowsNodesExist || !optionsNodesExist) {
      return;
    }

    // get header, rows, options nodes
    const headerNodes = tree.filter((c) => c.text.toLowerCase() === "header");
    const rowsNodes = tree.filter((c) => c.text.toLowerCase() === "rows");
    const optionsNodes = tree.filter((c) => c.text.toLowerCase() === "options");

    const options = {
      striped: optionsNodes[0]?.children.some(
        (c) => c.text.toLowerCase() === "striped"
      ),
      bordered: optionsNodes[0]?.children.some(
        (c) => c.text.toLowerCase() === "bordered"
      ),
      condensed: optionsNodes[0]?.children.some(
        (c) => c.text.toLowerCase() === "condensed"
      ),
      interactive: optionsNodes[0]?.children.some(
        (c) => c.text.toLowerCase() === "interactive"
      ),
    };

    setHeaderNodes(headerNodes);
    setRowsNodes(rowsNodes);
    setOptions(options);

    setLoading(false);
  };
  useEffect(() => {
    const tree = getBasicTreeByParentUid(blockUid);
    fetchData(tree).then(() =>
      console.log("useEffect: Loading after fetch:", loading)
    );
  }, [blockUid, loading]);

  const updateText = (uid: string, value: string) => {
    updateBlock({ uid, text: value });
  };
  function sanitizeClassName(text: string) {
    text = text.length > 20 ? text.substring(0, 20) : text;
    return text.replace(/[^a-zA-Z0-9-_]/g, "-");
  }

  return isEdit ? (
    <Configuration
      blockUid={blockUid}
      onSubmit={() => {
        setIsEdit(false);
        setHasData(true);
        fetchData(tree);
        console.log(`onsubmit`);
      }}
    />
  ) : (
    <HTMLTable
      className="roamjs-workbench-table"
      bordered={options.bordered}
      condensed={options.condensed}
      interactive={options.interactive}
      striped={options.striped}
    >
      <thead>
        <tr>
          {!!headerNodes.length &&
            headerNodes[0].children.map((c) => (
              <th
                key={c.uid}
                className={`wbt-header-${sanitizeClassName(c.text)}`}
              >
                <EditableText
                  placeholder=""
                  defaultValue={c.text}
                  onConfirm={(value) => updateText(c.uid, value)}
                />
              </th>
            ))}
        </tr>
      </thead>
      <tbody>
        {!!rowsNodes.length &&
          rowsNodes[0].children.map((c) => (
            <tr key={c.uid} className={`wbt-row-${sanitizeClassName(c.text)}`}>
              {c.children.map((c) => (
                <td key={c.uid}>
                  <EditableText
                    minWidth={55}
                    placeholder=""
                    defaultValue={c.text}
                    onConfirm={(value) => updateText(c.uid, value)}
                    className={`wbt-cell-${sanitizeClassName(c.text)}`}
                  />
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
    `);
    unloads.add(() => tableButtonObserver.disconnect());
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
