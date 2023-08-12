import React, { useState } from "react";
import {
  AnchorButton,
  Button,
  HTMLTable,
  Popover,
  Switch,
} from "@blueprintjs/core";
import { OnloadArgs } from "roamjs-components/types";
import { Feature } from "../index";

const SettingsTable =
  (
    FEATURES: Feature[],
    initialSettings: { [key: string]: boolean },
    extensionAPI: OnloadArgs["extensionAPI"]
  ) =>
  () => {
    const [featureToggleSettings, setFeatureToggleSettings] =
      useState(initialSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    const settingsStyle: React.CSSProperties = {
      maxWidth: "25px",
      minWidth: "initial",
      textAlign: "center",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: "white",
      verticalAlign: "middle",
    };
    const featureStyle: React.CSSProperties = {
      textAlign: "left",
      color: "white",
      verticalAlign: "middle",
    };
    const thBorder: React.CSSProperties = {
      borderTop: "none",
      borderRight: "none",
      borderLeft: "none",
      borderBottom: "1px solid gray",
    };
    const cellsBorder: React.CSSProperties = {
      border: "none",
    };
    const table = () => {
      return (
        <HTMLTable bordered={false}>
          <thead>
            <tr style={{ ...thBorder }}>
              <th style={{ ...settingsStyle }}>Info</th>
              <th style={{ ...featureStyle }}>Feature</th>
              <th style={{ ...settingsStyle }}>Documentation</th>
              {/* <th style={{ ...settingsStyle }}>Settings</th> */}
              <th style={{ ...settingsStyle }}>Enabled</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map(({ id, name, docs, module, description, gif }, i) => (
              <tr
                key={id}
                style={{
                  borderBottom:
                    i === FEATURES.length - 1 ? "none" : "solid 1px #293742",
                }}
              >
                <td style={{ ...settingsStyle, ...cellsBorder }}>
                  <Popover
                    content={
                      <div style={{ width: "540px", height: "380px" }}>
                        <p
                          style={{
                            padding: "6px",
                            margin: 0,
                            textAlign: "center",
                          }}
                        >
                          {description}
                        </p>
                        <img
                          style={{
                            width: "100%",
                          }}
                          src={`https://github.com/RoamJS/workbench/blob/main/docs/media/${gif}.gif?raw=true`}
                        />
                      </div>
                    }
                  >
                    <Button icon="info-sign" />
                  </Popover>
                </td>
                <td style={{ ...featureStyle, ...cellsBorder }}>
                  <span>{name}</span>
                </td>
                <td style={{ ...settingsStyle, ...cellsBorder }}>
                  <AnchorButton
                    intent="primary"
                    icon="document-open"
                    href={`https://github.com/RoamJs/workbench/blob/main/docs/${docs}`}
                  />
                </td>
                {/* <td style={{ ...settingsStyle, ...cellsBorder }}>
                  {settings ? (
                    <Button
                      intent="primary"
                      icon="cog"
                      onClick={() => {
                        console.log("Button clicked!");
                      }}
                    />
                  ) : null}
                </td> */}
                <td style={{ ...settingsStyle, ...cellsBorder }}>
                  <Switch
                    checked={featureToggleSettings[id]}
                    onChange={(e) => {
                      const updatedSettings = {
                        ...featureToggleSettings,
                        [id]: (e.target as HTMLInputElement).checked,
                      };
                      setFeatureToggleSettings(updatedSettings);
                      extensionAPI.settings.set(
                        id,
                        (e.target as HTMLInputElement).checked
                      );
                      module.toggleFeature(
                        (e.target as HTMLInputElement).checked,
                        extensionAPI
                      );
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </HTMLTable>
      );
    };

    return React.createElement(table);
  };

export default SettingsTable;
