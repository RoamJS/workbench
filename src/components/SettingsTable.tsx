import React, { useState } from "react";
import {
  AnchorButton,
  Button,
  Classes,
  Dialog,
  HTMLTable,
  Popover,
  Switch,
} from "@blueprintjs/core";
import { OnloadArgs } from "roamjs-components/types";
import { Feature } from "../index";
import LegacySettings from "./LegacySettings";

const SettingsTable =
  (FEATURES: Feature[], extensionAPI: OnloadArgs["extensionAPI"]) => () => {
    const initialSettings: { [key: string]: boolean } = {};
    FEATURES.forEach(({ id }) => {
      const flag = extensionAPI.settings.get(id);
      initialSettings[id] = !!flag;
    });
    const [featureToggleSettings, setFeatureToggleSettings] =
      useState(initialSettings);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentModuleId, setCurrentModuleId] = useState("");
    const handleOpenDialog = (moduleId: string) => {
      setCurrentModuleId(moduleId);
      setIsDialogOpen(true);
    };
    const settingsStyle: React.CSSProperties = {
      maxWidth: "25px",
      minWidth: "initial",
      textAlign: "center",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      verticalAlign: "middle",
    };
    const featureStyle: React.CSSProperties = {
      textAlign: "left",
      verticalAlign: "middle",
    };
    const thBorder: React.CSSProperties = {
      borderTop: "none",
      borderRight: "none",
      borderLeft: "none",
      borderBottom: "1px solid gray",
    };
    const noBorder: React.CSSProperties = {
      border: "none",
    };
    const isMaxWidth = window.matchMedia("(max-width: 1279px)").matches;

    return (
      <>
        <style>
          {/* override blueprint styles while still allowing 3rd party theming */}
          {`
            .rm-settings-panel table.workbench-settings th,
            .rm-settings-panel table.workbench-settings td {
              color: white;
            }
          `}
        </style>
        <HTMLTable
          bordered={false}
          style={{ ...noBorder }}
          className="workbench-settings"
        >
          <thead>
            <tr style={{ ...thBorder }}>
              <th style={{ ...settingsStyle, ...noBorder }}>Enabled</th>
              <th style={{ ...featureStyle, ...noBorder }}>Feature</th>
              <th
                style={{
                  ...settingsStyle,
                  ...noBorder,
                  display: isMaxWidth ? "none" : "",
                }}
              >
                Info
              </th>
              <th
                style={{
                  ...settingsStyle,
                  ...noBorder,
                  display: isMaxWidth ? "none" : "",
                }}
              >
                Settings
              </th>
              <th style={{ ...settingsStyle, ...noBorder }}>Documentation</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map(
              ({ id, name, docs, module, description, gif, settings }, i) => (
                <tr
                  key={id}
                  style={{
                    borderBottom:
                      i === FEATURES.length - 1 ? "none" : "solid 1px #293742",
                    borderRight: "none",
                    borderLeft: "none",
                  }}
                >
                  <td
                    aria-label="On/Off Switch"
                    style={{ ...settingsStyle, ...noBorder }}
                  >
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
                  <td
                    aria-label="Feature Name"
                    style={{ ...featureStyle, ...noBorder }}
                  >
                    <span>{name}</span>
                  </td>
                  <td
                    aria-label="Info button"
                    style={{
                      ...settingsStyle,
                      ...noBorder,
                      display: isMaxWidth ? "none" : "",
                    }}
                  >
                    <Popover
                      content={
                        <div style={{ width: "540px", height: "420px" }}>
                          <p
                            style={{
                              padding: "10px",
                              margin: 0,
                              textAlign: "center",
                              borderBottom: "1px solid lightgray",
                            }}
                          >
                            {description}
                          </p>
                          <img
                            style={{
                              width: "100%",
                              marginTop: "10px",
                            }}
                            src={`https://github.com/RoamJS/workbench/blob/main/docs/media/${gif}.gif?raw=true`}
                          />
                        </div>
                      }
                    >
                      <Button icon="info-sign" />
                    </Popover>
                  </td>
                  {/* https://github.com/RoamJS/workbench/issues/402 */}
                  <td
                    aria-label="Settings Button"
                    style={{
                      ...settingsStyle,
                      ...noBorder,
                      display: isMaxWidth ? "none" : "",
                    }}
                  >
                    {settings ? (
                      <Button icon="cog" onClick={() => handleOpenDialog(id)} />
                    ) : null}
                  </td>
                  <td
                    aria-label="Docs Button"
                    style={{ ...settingsStyle, ...noBorder }}
                  >
                    <AnchorButton
                      intent="primary"
                      icon="document-open"
                      href={`https://github.com/RoamJs/workbench/blob/main/docs/${docs}`}
                      target="_blank"
                    />
                  </td>
                </tr>
              )
            )}
          </tbody>
        </HTMLTable>
        <Dialog
          className="w-auto"
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          title="Module Settings"
          canOutsideClickClose
          canEscapeKeyClose
          autoFocus={false}
        >
          <div className={Classes.DIALOG_BODY}>
            <LegacySettings moduleId={currentModuleId} />
          </div>
        </Dialog>
      </>
    );
  };

export default SettingsTable;
