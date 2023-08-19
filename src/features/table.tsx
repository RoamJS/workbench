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

  const [headerNodes, setHeaderNodes] = useState<RoamBasicNode[]>([]);
  const [rowsNodes, setRowsNodes] = useState<RoamBasicNode[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const tree = getBasicTreeByParentUid(blockUid);
      let headerNodesResult = tree.filter(
        (c) => c.text.toLowerCase() === "header"
      );
      let rowsNodesResult = tree.filter((c) => c.text.toLowerCase() === "rows");

      if (!headerNodesResult.length) {
        headerNodesResult = await createHeaderNode();
      }

      if (!rowsNodesResult.length) {
        rowsNodesResult = await createRowsNode();
      }

      setHeaderNodes(headerNodesResult);
      setRowsNodes(rowsNodesResult);
    };

    fetchData();
  }, [blockUid]);

  const handleChange = (uid: string, value: string) => {
    updateBlock({ uid, text: value });
  };

  return !headerNodes.length || !rowsNodes.length ? (
    <div>loading</div>
  ) : (
    <HTMLTable striped={true}>
      <thead>
        <tr>
          {!!headerNodes.length &&
            headerNodes[0].children.map((c) => (
              <th key={c.uid} className={c.text}>
                <EditableText
                  placeholder=""
                  defaultValue={c.text}
                  onConfirm={(value) => handleChange(c.uid, value)}
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
                <td key={c.uid}>
                  <EditableText
                    placeholder=""
                    defaultValue={c.text}
                    onConfirm={(value) => handleChange(c.uid, value)}
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
