import React from "react";
import { Divider, HTMLTable } from "@blueprintjs/core";
import { get } from "../settings";
import { FEATURES } from "..";

const LegacySettings = ({ moduleId }: { moduleId: string }) => {
  const featureSettings = FEATURES.find((f) => f.id === moduleId)?.settings;
  if (!featureSettings) return <>No Settings For {moduleId}</>;

  const docs = FEATURES.find((f) => f.id === moduleId)?.docs;

  return (
    <div className="mx-auto">
      <HTMLTable bordered={false}>
        {Object.entries(featureSettings).map(([key, value]) => {
          const setting = get(value) || "Not Set";
          return (
            <tr>
              <td>{key}</td>
              <td>{setting}</td>
            </tr>
          );
        })}
      </HTMLTable>
      <Divider />
      {docs && (
        <div className="text-center">
          <a
            href={`https://github.com/RoamJs/workbench/blob/main/docs/${docs}`}
          >
            Documentation
          </a>
        </div>
      )}
    </div>
  );
};

export default LegacySettings;
