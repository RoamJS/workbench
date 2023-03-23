import differenceInMilliseconds from "date-fns/differenceInMilliseconds";
import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import { addCommand, newAddCommand } from "./workBench";
import React, {
  useCallback,
  useState,
  ChangeEvent,
  useMemo,
  useEffect,
} from "react";
import {
  Alert,
  Button,
  Checkbox,
  Classes,
  Dialog,
  Icon,
  InputGroup,
  Label,
  H6,
} from "@blueprintjs/core";
import parseNlpDate from "roamjs-components/date/parseNlpDate";
import formatDistanceToNow from "date-fns/formatDistanceToNow";

type AlertContent = {
  when: string;
  message: string;
  id: number;
  allowNotification: boolean;
};

const LOCAL_STORAGE_KEY = "roamjsAlerts";

const removeAlertById = (alertId: number) => {
  const { alerts } = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
  localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify({
      alerts: alerts.filter((a: AlertContent) => a.id !== alertId),
    })
  );
};

const AlertDashboard = ({ isOpen, onClose }: RoamOverlayProps) => {
  const [alerts, setAlerts] = useState<AlertContent[]>(() => {
    const storage = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storage) {
      const { alerts: storageAlerts } = JSON.parse(storage);
      return storageAlerts;
    } else {
      return [];
    }
  });
  return (
    <Dialog
      isOpen={isOpen}
      title={"Live Alerts"}
      onClose={onClose}
      enforceFocus={false}
      autoFocus={false}
    >
      <ul>
        {alerts.map((a) => (
          <li key={a.id}>
            {new Date(a.when).toLocaleString()} - {a.message}
            <Button
              onClick={() => {
                window.clearTimeout(a.id);
                removeAlertById(a.id);
                setAlerts(alerts.filter((aa) => aa.id !== a.id));
              }}
            >
              <Icon icon={"trash"} />
            </Button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
};

const WindowAlert = ({
  isOpen,
  onClose,
  ...input
}: RoamOverlayProps<Pick<AlertContent, "id" | "message">>) => {
  const oldTitle = useMemo(() => document.title, []);
  useEffect(() => {
    document.title = `* ${document.title}`;
    removeAlertById(input.id);
    return () => {
      document.title = oldTitle;
    };
  }, [oldTitle]);
  return (
    <Alert isOpen={isOpen} className={"roamjs-window-alert"} onClose={onClose}>
      <H6>RoamJS Alert</H6>
      {input.message}
    </Alert>
  );
};

const openWindowAlert = (props: Pick<AlertContent, "id" | "message">) =>
  renderOverlay({ id: "window-alert", Overlay: WindowAlert, props });

let unloads = new Set<() => void>();

const schedule = (
  input: Omit<Omit<AlertContent, "when">, "id"> & { timeout: number }
): number => {
  const id = window.setTimeout(() => {
    if (
      input.allowNotification &&
      window.Notification.permission === "granted"
    ) {
      const n = new window.Notification("RoamJS Alert", {
        body: input.message,
      });
      n.addEventListener("show", () => removeAlertById(id));
    } else {
      openWindowAlert({ message: input.message, id });
    }
  }, input.timeout);
  unloads.add(() => window.clearTimeout(id));
  return id;
};

const NewAlertContent = ({
  setScheduled,
  blockUid,
}: {
  setScheduled: (s: string) => void;
  blockUid: string;
}) => {
  const [when, setWhen] = useState("");
  const onWhenChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setWhen(e.target.value),
    [setWhen]
  );
  const [message, setMessage] = useState("");
  const onMessageChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value),
    [setMessage]
  );
  const [allowNotification, setAllowNotification] = useState(false);
  const onCheckboxChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setAllowNotification(e.target.checked);
      if (window.Notification.permission === "default" && e.target.checked) {
        Notification.requestPermission().then((result) => {
          if (result === "denied") {
            setAllowNotification(false);
          }
        });
      }
    },
    [setAllowNotification]
  );
  const onButtonClick = useCallback(async () => {
    const whenDate = parseNlpDate(when);
    const timeout = differenceInMilliseconds(whenDate, new Date());
    if (timeout > 0) {
      const storage = localStorage.getItem(LOCAL_STORAGE_KEY);
      const { alerts } = storage ? JSON.parse(storage) : { alerts: [] };
      const id = schedule({
        message,
        timeout,
        allowNotification,
      });
      setScheduled(formatDistanceToNow(whenDate));

      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          alerts: [
            ...alerts,
            {
              when: whenDate.toJSON(),
              message,
              id,
            },
          ],
        })
      );
    } else {
      setScheduled("DONE");
      window.roamAlphaAPI.updateBlock({
        block: {
          string: `Alert scheduled with an invalid date`,
          uid: blockUid,
        },
      });
    }
  }, [when, message, allowNotification, close]);
  return (
    <div style={{ padding: 8, paddingRight: 24 }}>
      <InputGroup
        value={when}
        onChange={onWhenChange}
        placeholder={"When"}
        style={{ margin: 8 }}
        autoFocus={true}
      />
      <InputGroup
        value={message}
        onChange={onMessageChange}
        placeholder={"Message"}
        style={{ margin: 8 }}
      />
      <Label style={{ margin: 8 }}>
        Allow Notification?
        <Checkbox
          checked={allowNotification}
          onChange={onCheckboxChange}
          disabled={window.Notification.permission === "denied"}
        />
      </Label>
      <Button text="Schedule" onClick={onButtonClick} style={{ margin: 8 }} />
    </div>
  );
};

const NewAlertDialog = ({
  isOpen,
  onClose,
  blockUid,
}: RoamOverlayProps<{ blockUid: string }>) => {
  const [scheduled, setScheduled] = useState("");
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={scheduled ? "Confirmed" : "Create new alert"}
      enforceFocus={false}
      autoFocus={false}
    >
      <div className={Classes.DIALOG_BODY}>
        {scheduled ? (
          `Alert scheduled to trigger in ${scheduled}`
        ) : (
          <NewAlertContent setScheduled={setScheduled} blockUid={blockUid} />
        )}
      </div>
    </Dialog>
  );
};

const createNewAlert = () =>
  renderOverlay({
    id: "workbench-alert",
    Overlay: NewAlertDialog,
  });

const openAlertDashboard = () =>
  renderOverlay({ id: "alert-dashboard", Overlay: AlertDashboard });

let enabled = false;
export const toggleFeature = (flag: boolean, extensionAPI: any) => {
  enabled = flag;
  if (enabled) {
    unloads.add(
      newAddCommand(
        {
          label: "Create New Alert",
          callback: createNewAlert,
        },
        extensionAPI
      )
    );
    unloads.add(
      newAddCommand(
        {
          label: "View Current Alerts",
          callback: openAlertDashboard,
        },
        extensionAPI
      )
    );
    const storage = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storage) {
      const { alerts } = JSON.parse(storage) as {
        alerts: AlertContent[];
      };
      const validAlerts = alerts.filter((a) => {
        const timeout = differenceInMilliseconds(new Date(a.when), new Date());
        if (timeout > 0) {
          schedule({
            message: a.message,
            timeout,
            allowNotification: a.allowNotification,
          });
          return true;
        }
        return false;
      });
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          alerts: validAlerts,
        })
      );
    }
  } else {
    unloads.forEach((u) => u());
    unloads.clear();
  }
};
