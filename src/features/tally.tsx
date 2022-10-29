import createButtonObserver from "roamjs-components/dom/createButtonObserver";
import getUidsFromButton from "roamjs-components/dom/getUidsFromButton";
import getFullTreeByParentUid from "roamjs-components/queries/getFullTreeByParentUid";
import { Button, InputGroup } from "@blueprintjs/core";
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import createBlock from "roamjs-components/writes/createBlock";
import updateBlock from "roamjs-components/writes/updateBlock";

const TallyCounter = ({
  initialValue,
  blockUid,
}: {
  initialValue: number;
  blockUid: string;
}): JSX.Element => {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    updateBlock({ text: value.toString(), uid: blockUid });
  }, [value, blockUid]);
  return (
    <div
      style={{
        display: "flex",
        width: 120,
      }}
    >
      <Button text="+" onClick={() => setValue(value + 1)} />
      <InputGroup
        value={value.toString()}
        disabled={true}
        style={{ textAlign: "right" }}
      />
      <Button text="-" onClick={() => setValue(value - 1)} />
    </div>
  );
};

const unloads = new Set<() => void>();
export const toggleFeature = (flag: boolean) => {
  if (flag) {
    const tallyButtonObserver = createButtonObserver({
      shortcut: "tally",
      attribute: "tally-button",
      render: async (b: HTMLButtonElement) => {
        const { blockUid } = getUidsFromButton(b);
        const tree = getFullTreeByParentUid(blockUid);
        const initialValueNode = tree.children.find(
          (c) => !isNaN(parseInt(c.text))
        );
        const initialValue = initialValueNode
          ? parseInt(initialValueNode.text)
          : 0;
        const uid =
          initialValueNode?.uid ||
          (await createBlock({ node: { text: "0" }, parentUid: blockUid }));
        ReactDOM.render(
          <TallyCounter initialValue={initialValue} blockUid={uid} />,
          b.parentElement
        );
      },
    });
    unloads.add(() => tallyButtonObserver.disconnect());
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
