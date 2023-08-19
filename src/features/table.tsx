import React, { useEffect, useState } from "react";
import { HTMLTable, EditableText } from "@blueprintjs/core";
import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import createBlock from "roamjs-components/writes/createBlock";
import updateBlock from "roamjs-components/writes/updateBlock";
import { createComponentRender } from "roamjs-components/components/ComponentContainer";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import { RoamBasicNode } from "roamjs-components/types";

const Table = ({ blockUid }: { blockUid: string }): JSX.Element => {
  const createHeaderNode = async () => {
    const headerUid = window.roamAlphaAPI.util.generateUID();
    await createBlock({
      node: {
        text: "header",
        uid: headerUid,
        children: [
          { text: "Header 1" },
          { text: "Header 2" },
          { text: "Header 3" },
        ],
      },
      parentUid: blockUid,
    });
    return getBasicTreeByParentUid(headerUid);
  };

  const createRowsNode = async () => {
    const rowUid = window.roamAlphaAPI.util.generateUID();
    await createBlock({
      node: {
        text: "rows",
        uid: rowUid,
        children: [
          {
            text: "row1",
            children: [{ text: "" }, { text: "" }, { text: "" }],
          },
          {
            text: "row2",
            children: [{ text: "" }, { text: "" }, { text: "" }],
          },
          {
            text: "row3",
            children: [{ text: "" }, { text: "" }, { text: "" }],
          },
        ],
      },
      parentUid: blockUid,
    });
    return getBasicTreeByParentUid(rowUid);
  };
  const createOptionsNode = async () => {
    const optionsUid = window.roamAlphaAPI.util.generateUID();
    await createBlock({
      node: {
        text: "options",
        uid: optionsUid,
        children: [
          {
            text: "striped",
          },
        ],
      },
      parentUid: blockUid,
    });
    return getBasicTreeByParentUid(optionsUid);
  };

  const [loading, setLoading] = useState(true);
  const [headerNodes, setHeaderNodes] = useState<RoamBasicNode[]>([]);
  const [rowsNodes, setRowsNodes] = useState<RoamBasicNode[]>([]);
  const [options, setOptions] = useState<{
    striped?: boolean;
    bordered?: boolean;
    condensed?: boolean;
    interactive?: boolean;
  }>({});

  const fetchData = async () => {
    const tree = getBasicTreeByParentUid(blockUid);

    // check if header, rows, options nodes exist
    const headerNodesExist = tree.some(
      (c) => c.text.toLowerCase() === "header"
    );
    const rowsNodesExist = tree.some((c) => c.text.toLowerCase() === "rows");
    const optionsNodesExist = tree.some(
      (c) => c.text.toLowerCase() === "options"
    );

    // create initial config
    if (!headerNodesExist) await createHeaderNode();
    if (!rowsNodesExist) await createRowsNode();
    if (!optionsNodesExist) await createOptionsNode();

    // fold {{wb-table}} block on first create
    if (!headerNodesExist && !rowsNodesExist && !optionsNodesExist) {
      window.roamAlphaAPI.data.block.update({
        block: { uid: blockUid, open: false },
      });
    }

    // get header, rows, options nodes
    const updatedTree = getBasicTreeByParentUid(blockUid);
    const headerNodes = updatedTree.filter(
      (c) => c.text.toLowerCase() === "header"
    );
    const rowsNodes = updatedTree.filter(
      (c) => c.text.toLowerCase() === "rows"
    );
    const optionsNodes = updatedTree.filter(
      (c) => c.text.toLowerCase() === "options"
    );

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
    fetchData();
  }, [blockUid]);

  const updateText = (uid: string, value: string) => {
    updateBlock({ uid, text: value });
  };

  return loading ? (
    <div
      style={{
        width: "300px",
        height: "150px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      loading ...
    </div>
  ) : (
    <HTMLTable
      className="workbench-table"
      bordered={options.bordered}
      condensed={options.condensed}
      interactive={options.interactive}
      striped={options.striped}
    >
      <thead>
        <tr>
          {!!headerNodes.length &&
            headerNodes[0].children.map((c) => (
              <th key={c.uid} className={c.text}>
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
            <tr key={c.uid} className={c.text}>
              {c.children.map((c) => (
                <td key={c.uid} style={{ margin: "10px" }}>
                  <EditableText
                    minWidth={55}
                    placeholder=""
                    defaultValue={c.text}
                    onConfirm={(value) => updateText(c.uid, value)}
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
    unloads.add(() => tableButtonObserver.disconnect());
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
