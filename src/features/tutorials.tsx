import renderOverlay, {
  RoamOverlayProps,
} from "roamjs-components/util/renderOverlay";
import getCurrentUserEmail from "roamjs-components/queries/getCurrentUserEmail";
import getCurrentUserDisplayName from "roamjs-components/queries/getCurrentUserDisplayName";
import {
  Button,
  Classes,
  Drawer,
  Dialog,
  Divider,
  Icon,
  Menu,
  MenuItem,
  Popover,
  Tooltip,
} from "@blueprintjs/core";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import {
  component as dnpComponent,
  enabled as dnpEnabled,
} from "./dailyNotesPopup";
import { enabled as typeAheadEnabled, typeAheadLookup } from "./dictionary";
import { addCommand } from "./workBench";
import {
  enabled as privacyEnabled,
  active as privacyActive,
  toggle as privacyToggle,
} from "./privacyMode";
import {
  enabled as formatConverterEnabled,
  htmlview,
  show as formatConverterShow,
} from "./formatConverter";
import {
  enabled as deepNavEnabled,
  navigate as triggerDeepNav,
} from "./deepnav";
import quickReference from "../data/quickReference";

const TutorialOverlay = ({ onClose, isOpen }: RoamOverlayProps<{}>) => {
  const [bigPictureLink, setBigPictureLink] = useState("");
  function playYT(videoID: string) {
    setBigPictureLink(`https://www.youtube.com/embed/${videoID}`);
  }
  // function playLoom(videoID: string) {
  //   setBigPictureLink(
  //     "https://www.useloom.com/embed/" + videoID + "?autoplay=1"
  //   );
  // }
  return (
    <Drawer
      onClose={onClose}
      isOpen={isOpen}
      title={"Tutorials for WorkBench and Roam"}
      position={"left"}
      hasBackdrop={false}
      canOutsideClickClose={false}
      style={{ width: 600 }}
      portalClassName={"pointer-events-none"}
      className={"pointer-events-auto"}
      enforceFocus={false}
      autoFocus={false}
    >
      <div className={Classes.DRAWER_BODY} id={"workbench-tutorial-drawer"}>
        <div>
          <style
            dangerouslySetInnerHTML={{
              __html:
                "div.workbench-tutorials-big-picture { width: auto; }\n .workbench-guide {\n      border-bottom: 1px solid DarkSlateGray;\n      margin-bottom: 30px;\n      padding-bottom: 5px;\n    }\n    .workbench-guide .sectionheaders{\n      font-size: 14pt;\n      font-weight: bold;\n      color: DarkSlateGray;\n      height: 25px;\n      margin-bottom: 0px;\n      padding-top:    2px;\n      padding-bottom: 7px;\n      padding-left: 5px;\n      border-bottom: 1px solid DarkSlateGray;\n      border-top:    1px solid DarkSlateGray;\n     }\n    .row {\n      display: flex; \n      flex-wrap: wrap;\n      margin-bottom: 10px;\n      margin-top: 10px;\n      padding-left: 5px;\n    }\n    .workbench-guide .item {\n      padding-right:15px;\n      padding-bottom:10px;\n      cursor: pointer;\n    }\n    .workbench-guide .itemheader {\n      font-weight:    bold;\n      font-size:      11pt;\n      color: DarkSlateGray;\n      padding-left: 2px;\n      padding-bottom: 4px;\n      border-bottom: 1px solid DarkSlateGray;\n    }\n    .workbench-guide .itemimage {\n      width:   100px;\n            border-left: 1px solid DarkSlateGray;\n\n    }\n  ",
            }}
          />
          <div
            className="workbench-guide"
            style={{ borderBottom: 0, marginBottom: 0, paddingBottom: 5 }}
          >
            <div className="sectionheaders">SmartBlocks Tutorials</div>
            <div className="row">
              <div className="item" onClick={() => playYT("xfnr5F4Yz8Y")}>
                <div className="itemheader">Roam Templates</div>
                <img
                  className="itemimage"
                  src="https://cdn.glitch.com/0724de4c-afa5-4cf0-b5a4-a0e2c9ba2ddf%2FRJNessSBTutorial01.png?v=1611416013902"
                />
              </div>
              <div className="item" onClick={() => playYT("zIbiLUVhuRU")}>
                <div className="itemheader">What are they?</div>
                <img
                  className="itemimage"
                  src="https://cdn.glitch.com/0724de4c-afa5-4cf0-b5a4-a0e2c9ba2ddf%2FRJNessSBTutorial02.png?v=1611416013981"
                />
              </div>
              <div className="item" onClick={() => playYT("dQWc6fWvRBk")}>
                <div className="itemheader">Simple Workflows</div>
                <img
                  className="itemimage"
                  src="https://cdn.glitch.com/0724de4c-afa5-4cf0-b5a4-a0e2c9ba2ddf%2FRJNessSBTutorial03.png?v=1611416013768"
                />
              </div>
              <div className="item" onClick={() => playYT("8S6CLtYK3hg")}>
                <div className="itemheader">Basic Commands</div>
                <img
                  className="itemimage"
                  src="https://cdn.glitch.com/0724de4c-afa5-4cf0-b5a4-a0e2c9ba2ddf%2FRJNessSBTutorial04.png?v=1611416013617"
                />
              </div>
              <div className="item" onClick={() => playYT("t_BlKXxrHGo")}>
                <div className="itemheader">Date Commands</div>
                <img
                  className="itemimage"
                  src="https://cdn.glitch.com/0724de4c-afa5-4cf0-b5a4-a0e2c9ba2ddf%2FRJNessSBTutorial03.png?v=1611416013768"
                />
              </div>
              <div className="item" onClick={() => playYT("-tHQtgnXcwo")}>
                <div className="itemheader">The Realworld</div>
                <img
                  className="itemimage"
                  src="https://i.ytimg.com/vi/-tHQtgnXcwo/hqdefault.jpg?sqp=-oaymwEZCPYBEIoBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLDZW1C7KLJP91fBry4hNbevPGRlUg"
                />
              </div>
              <div className="item" onClick={() => playYT("rJZNMZoqwNY")}>
                <div className="itemheader">Developer Deep Dive</div>
                <img
                  className="itemimage"
                  src="https://cdn.glitch.com/0724de4c-afa5-4cf0-b5a4-a0e2c9ba2ddf%2Fsbdeepdive.webp?v=1611085493732"
                />
              </div>
            </div>
          </div>
          <div className="workbench-guide">
            <div className="sectionheaders">WorkBench Features</div>
            <div className="row">
              <div className="item" onClick={() => playYT("f1UR9dMR_k0")}>
                <div className="itemheader">Privacy Mode</div>
                <img
                  className="itemimage"
                  src="https://cdn.glitch.com/0724de4c-afa5-4cf0-b5a4-a0e2c9ba2ddf%2Fprivacymode.webp?v=1603648995430"
                />
              </div>
              <div className="item" onClick={() => playYT("tb_6HdAhZwo")}>
                <div className="itemheader">Deep Nav</div>
                <img
                  className="itemimage"
                  src="https://cdn.glitch.com/0724de4c-afa5-4cf0-b5a4-a0e2c9ba2ddf%2Fdeepnav.webp?v=1603650099658"
                />
              </div>
              <div className="item" onClick={() => playYT("GU2Ju-Y4FPQ")}>
                <div className="itemheader">Jump Nav</div>
                <img
                  className="itemimage"
                  src="https://i.ytimg.com/vi/GU2Ju-Y4FPQ/hqdefault.jpg?sqp=-oaymwEZCNACELwBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLDpj-0aeN0wYP-q_2Uoep5zOer_7w"
                />
              </div>
              <div className="item" onClick={() => playYT("Q2Bn-7l3gVk")}>
                <div className="itemheader">Dictionary</div>
                <img
                  className="itemimage"
                  src="https://cdn.glitch.com/0724de4c-afa5-4cf0-b5a4-a0e2c9ba2ddf%2Fdictionary.webp?v=1603649139168"
                />
              </div>
              <div className="item" onClick={() => playYT("o1RadyuMCA8")}>
                <div className="itemheader">Live Preview</div>
                <img
                  className="itemimage"
                  src="https://i.ytimg.com/vi/o1RadyuMCA8/hqdefault.jpg?sqp=-oaymwEZCNACELwBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLCeaJBHklB4PucM9m03z-bARw2viw"
                />
              </div>
              <div className="item" onClick={() => playYT("wbNMKa232MM")}>
                <div className="itemheader">Daily Notes Popup</div>
                <img
                  className="itemimage"
                  src="https://i.ytimg.com/vi/wbNMKa232MM/hqdefault.jpg?sqp=-oaymwEZCNACELwBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLA5-akQ7f7KjYPjo50-bP2FcGgvdQ"
                />
              </div>
              <div className="item" onClick={() => playYT("agSaAtpCU_A")}>
                <div className="itemheader">Tutorials</div>
                <img
                  className="itemimage"
                  src="https://cdn.glitch.com/0724de4c-afa5-4cf0-b5a4-a0e2c9ba2ddf%2Ftutorials.webp?v=1603649403319"
                />
              </div>
            </div>
          </div>
          <style
            dangerouslySetInnerHTML={{
              __html:
                "\n    .LearnRoam {\n      height: 1000px;\n      width: 180px;\n      scrollbar-width: thin;\n      margins:0px;\n      float: left;\n      overflow-y: auto;\n    }\n   .LearnRoam .sectionheaders {\n      font-size: 13pt;\n      font-weight: bold;\n      height: 25px;\n    }\n    .LearnRoam .item {\n      padding:2px;\n      cursor: pointer;\n    }\n    .LearnRoam .itemheader {\n      font-weight:    bold;\n      font-size:      10pt;\n      padding-bottom: 10px;\n    }\n    .LearnRoam .itemimage {\n      width:   150px;\n      padding-bottom: 12px;\n    }\n    .LearnRoam .itemlesson {\n      color: teal;\n      font-size: 10pt;\n    }\n  ",
            }}
          />
          <div className="LearnRoam">
            <div className="sectionheaders">Learn Roam</div>
            <div className="item" onClick={() => playYT("4yXK9OMc2OU")}>
              <div>
                <div className="itemheader">
                  100 Roam Tips for Beginners
                  <br />
                  Marc Koenig
                </div>
                <img
                  className="itemimage"
                  src="https://i.ytimg.com/vi/4yXK9OMc2OU/hq720.jpg"
                />
              </div>
            </div>
            <div className="item" onClick={() => playYT("hGzTuIPXv7I")}>
              <div>
                <div className="itemheader">
                  Blocks: What Makes Them Unique
                  <br />
                  Lisa Marie
                </div>
                <img
                  className="itemimage"
                  src="https://i.ytimg.com/vi/hGzTuIPXv7I/hqdefault.jpg"
                />
              </div>
            </div>
            <div className="item" onClick={() => playYT("UTxCbLIifXU")}>
              <div>
                <div className="itemheader">
                  Indent with Intent
                  <br />
                  R.J Nestor
                </div>
                <img
                  className="itemimage"
                  src="https://i.ytimg.com/vi/UTxCbLIifXU/hqdefault.jpg?sqp=-oaymwEZCPYBEIoBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLAjFCgCa40uqd0eU8JcF81e3lgD3Q"
                />
              </div>
            </div>
            <div className="item" onClick={() => playYT("WTSHhj92pvM")}>
              <div>
                <div className="itemheader">
                  Daily Journal
                  <br />
                  Shu Omi
                </div>
                <img
                  className="itemimage"
                  src="https://i.ytimg.com/vi/WTSHhj92pvM/hqdefault.jpg?sqp=-oaymwEYCKgBEF5IVfKriqkDCwgBFQAAiEIYAXAB&rs=AOn4CLDcARk7-H7zPKNXVpzGxXaadYGb7Q"
                />
              </div>
            </div>
            <div className="item" onClick={() => playYT("LJZBGJOzhUY")}>
              <div>
                <div className="itemheader">
                  Query syntax and logic
                  <br />
                  Rob Haisfield
                </div>
                <img
                  className="itemimage"
                  src="https://i.ytimg.com/vi/LJZBGJOzhUY/hq720.jpg?sqp=-oaymwEZCNAFEJQDSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLAijE5V_ZUb0um1WlDqzcaQyXBqOg"
                />
              </div>
            </div>
            <div className="item" onClick={() => playYT("V1lLQ5fFw")}>
              <div>
                <div className="itemheader">
                  roam/js basics
                  <br />
                  David Vargas
                </div>
                <img
                  className="itemimage"
                  src="https://cdn.glitch.com/0724de4c-afa5-4cf0-b5a4-a0e2c9ba2ddf%2Fdvargas01.png?v=1611419614801"
                />
              </div>
            </div>
          </div>
          <style
            dangerouslySetInnerHTML={{
              __html:
                "\n    .interviews {\n      display: flex; \n      flex-direction:  column;\n      border-left:1px solid silver;\n      padding-left: 5px;\n    }\n    .interviews .sectionheaders {\n      font-size: 13pt;\n      font-weight: bold;\n      height: 25px;\n      margin-left: 4px;\n    }\n    .interviews .section{\n      display: flex; \n      flex-direction:  column;\n    }\n    .interviews .item {\n      padding:5px;\n      width: 175px;\n      cursor: pointer;\n    }\n    .interviews .itemheader {\n      font-weight:    bold;\n      font-size:      10pt;\n      padding-bottom: 10px;\n    }\n    .interviews .itemimage {\n      width:   165px;\n    }\n\n  ",
            }}
          />
          <div className="interviews">
            <div className="sectionheaders">Great Interviews</div>
            <div style={{ display: "flex" }}>
              <div className="section">
                <div className="item" onClick={() => playYT("U0y-0CprHao")}>
                  <div>
                    <div className="itemheader">
                      Roam Summit: Journaling in Roam
                    </div>
                    <img
                      className="itemimage"
                      src="https://i.ytimg.com/vi/U0y-0CprHao/hqdefault.jpg"
                    />
                  </div>
                </div>
                <div className="item" onClick={() => playYT("JoCjpTXCklw")}>
                  <div>
                    <div className="itemheader">Professor Joel Chan</div>
                    <img
                      className="itemimage"
                      src="https://i.ytimg.com/vi/A6PIrVZoZAk/hqdefault.jpg?sqp=-oaymwEZCNACELwBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLBEpLRjad0GV9jI2eTynYiSFXO8Kg"
                    />
                  </div>
                </div>
                <div className="item" onClick={() => playYT("KoddCmn3eL0")}>
                  <div>
                    <div className="itemheader">Beau Haan (Zettelkasten)</div>
                    <img
                      className="itemimage"
                      src="https://cdn.glitch.com/0724de4c-afa5-4cf0-b5a4-a0e2c9ba2ddf%2F0d769d5e-1012-4b1f-9eac-a148f8835246.image.png?v=1608306632528"
                    />
                  </div>
                </div>
                <div className="item" onClick={() => playYT("cO_z04mfG90")}>
                  <div>
                    <div className="itemheader">Historian Mark Robertson</div>
                    <img
                      className="itemimage"
                      src="https://i.ytimg.com/vi/O3Chd8ECy2A/hqdefault.jpg?sqp=-oaymwEZCNACELwBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLBfMIinuCWUSBn-XChOrQDiNRyf3A"
                    />
                  </div>
                </div>
                <div className="item" onClick={() => playYT("RXXXHN516qc")}>
                  <div>
                    <div className="itemheader">Web guru Maggie Appleton</div>
                    <img
                      className="itemimage"
                      src="https://i.ytimg.com/vi/RXXXHN516qc/hqdefault.jpg?sqp=-oaymwEZCNACELwBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLDWqm_oUVlsB-bNN-6pqC0PpvcgAw"
                    />
                  </div>
                </div>
                <div className="item" onClick={() => playYT("Pdk0tZE68JY")}>
                  <div className="itemheader">Rosie Campbell</div>
                  <img
                    className="itemimage"
                    src="https://i.ytimg.com/vi/Pdk0tZE68JY/hqdefault.jpg?sqp=-oaymwEZCNACELwBSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLDnp71nz8df1p3LxtSZgpJ9Nv9QIQ"
                  />
                </div>
                <div className="item" onClick={() => playYT("qS4Z_PSM8Xs")}>
                  <div className="itemheader">
                    Pathwright CEO and Conceptual Designer Paul Johnson
                  </div>
                  <img
                    className="itemimage"
                    src="https://i.ytimg.com/vi/qS4Z_PSM8Xs/hq720.jpg?sqp=-oaymwEZCNAFEJQDSFXyq4qpAwsIARUAAIhCGAFwAQ==&rs=AOn4CLAt0OYFyqoXs9bJQctrdDFaaeSViA"
                  />
                </div>
              </div>
              <div className="section">
                <div className="item">
                  <div>
                    <div className="itemheader">
                      RoamFM: Richard Meadows (Optionality)
                    </div>
                    <iframe
                      src="https://www.listennotes.com/embedded/e/730a898c421f4674806058823e71888c/"
                      height="100px"
                      width="100%"
                      style={{ width: 1, minWidth: "100%" }}
                      loading="lazy"
                      frameBorder={0}
                      scrolling="no"
                    />
                  </div>
                </div>
                <div className="item">
                  <div>
                    <div className="itemheader">
                      RoamFM: Mridula Duggal (Macroeconomics)
                    </div>
                    <iframe
                      src="https://www.listennotes.com/embedded/e/730a898c421f4674806058823e71888c/"
                      height="100px"
                      width="100%"
                      style={{ width: 1, minWidth: "100%" }}
                      loading="lazy"
                      frameBorder={0}
                      scrolling="no"
                    />
                  </div>
                </div>
                <div className="item">
                  <div>
                    <div className="itemheader">
                      RoamFM: Cortex Futura (Algorithms of Thought)
                    </div>
                    <iframe
                      src="https://www.listennotes.com/embedded/e/dc97e432f30346e3aecf9caf81594060/"
                      height="100px"
                      width="100%"
                      style={{ width: 1, minWidth: "100%" }}
                      loading="lazy"
                      frameBorder={0}
                      scrolling="no"
                    />
                  </div>
                </div>
                <div className="item">
                  <div>
                    <div className="itemheader">
                      RoamFM: Drew Coffman (Da Vinci)
                    </div>
                    <iframe
                      src="https://www.listennotes.com/embedded/e/1c60386382d44af38e92cb2bcc16734c/"
                      height="100px"
                      width="100%"
                      style={{ width: 1, minWidth: "100%" }}
                      loading="lazy"
                      frameBorder={0}
                      scrolling="no"
                    />
                  </div>
                </div>
                <div className="item">
                  <div>
                    <div className="itemheader">
                      RoamFM: Joel Chan (Synthesis)
                    </div>
                    <iframe
                      src="https://www.listennotes.com/embedded/e/1c60386382d44af38e92cb2bcc16734c/"
                      height="100px"
                      width="100%"
                      style={{ width: 1, minWidth: "100%" }}
                      loading="lazy"
                      frameBorder={0}
                      scrolling="no"
                    />
                  </div>
                </div>
                <div className="item">
                  <div>
                    <div className="itemheader">
                      RoamFM: Brandon Toner (Healthcare)
                    </div>
                    <iframe
                      src="https://www.listennotes.com/embedded/e/1c60386382d44af38e92cb2bcc16734c/"
                      height="100px"
                      width="100%"
                      style={{ width: 1, minWidth: "100%" }}
                      loading="lazy"
                      frameBorder={0}
                      scrolling="no"
                    />
                  </div>
                </div>
                <div className="item">
                  <div>
                    <div className="itemheader">
                      RoamFM: Tracy Winchell (Journalling)
                    </div>
                    <iframe
                      src="https://www.listennotes.com/embedded/e/28c0aa043e6b4ed1b0004afa098a0675/"
                      height="100px"
                      width="100%"
                      style={{ width: 1, minWidth: "100%" }}
                      loading="lazy"
                      frameBorder={0}
                      scrolling="no"
                    />
                  </div>
                </div>
                <div className="item">
                  <div>
                    <div className="itemheader">
                      RoamFM: Kahlil Corazo (Project Management){" "}
                    </div>
                    <iframe
                      src="https://www.listennotes.com/embedded/e/5d5ba897abdf4cac996f89147d40926b/"
                      height="100px"
                      width="100%"
                      style={{ width: 1, minWidth: "100%" }}
                      loading="lazy"
                      frameBorder={0}
                      scrolling="no"
                    />
                  </div>
                </div>
                <div className="item">
                  <div>
                    <div className="itemheader">
                      RoamFM: David Crandall (Data Architecture){" "}
                    </div>
                    <iframe
                      src="https://www.listennotes.com/embedded/e/2bc4da1b60864575a32a23c976104176/"
                      height="100px"
                      width="100%"
                      style={{ width: 1, minWidth: "100%" }}
                      loading="lazy"
                      frameBorder={0}
                      scrolling="no"
                    />
                  </div>
                </div>
                <div className="item">
                  <div>
                    <div className="itemheader">
                      RoamFM: Cherry Sun (Lab Research){" "}
                    </div>
                    <iframe
                      src="https://www.listennotes.com/embedded/e/81c6097a819d4cc080952f137ee3eabf/"
                      height="100px"
                      width="150px"
                      style={{ width: 1, minWidth: "100%" }}
                      loading="lazy"
                      frameBorder={0}
                      scrolling="no"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Dialog
        isOpen={!!bigPictureLink}
        onClose={() => setBigPictureLink("")}
        className={"workbench-tutorials-big-picture"}
      >
        <div className={Classes.DIALOG_BODY}>
          <iframe
            width="1080"
            height="630"
            src={bigPictureLink}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Dialog>
    </Drawer>
  );
};

const showTutorials = () => {
  if (!document.getElementById("workbench-tutorial-drawer"))
    renderOverlay({
      Overlay: TutorialOverlay,
    });
};

const QuickRefOverlay = ({ onClose, isOpen }: RoamOverlayProps<{}>) => {
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const copyRefs = useMemo(() => {
    const searchValue = query.toLowerCase();
    return quickReference
      .map((topic) => {
        const newItems = topic.items.filter(
          (item) =>
            (item.c1 || "").toLowerCase().includes(searchValue) ||
            (item.c2 || "").toLowerCase().includes(searchValue) ||
            (item.c3 || "").toLowerCase().includes(searchValue)
        );
        return { ...topic, items: newItems };
      })
      .filter((t) => !!t.items.length);
  }, [query]);
  const observerRef = useRef(null);
  useEffect(() => {
    if (loaded && observerRef.current) {
      const observer = new IntersectionObserver(
        function (entries) {
          if (entries[0].isIntersecting) {
            document
              .querySelectorAll(".rqrTopicActive")
              .forEach(function (oldE) {
                oldE.className = "rqrTopicListItem";
              });
            document.querySelector(
              "#" + entries[0].target.id.replace("rqrTopicHeader", "rqrtli")
            ).className = "rqrTopicActive";
          }
        },
        { rootMargin: "0px 0px -810px", threshold: [1] }
      );
      observer.observe(observerRef.current);
      return () => observer.disconnect();
    } else {
      setLoaded(true);
    }
  }, [loaded, setLoaded]);
  return (
    <Drawer
      onClose={onClose}
      isOpen={isOpen}
      title={"Quick Reference for WorkBench and Roam"}
      position={"left"}
      hasBackdrop={false}
      canOutsideClickClose={false}
      style={{ width: 600 }}
      portalClassName={"pointer-events-none"}
      className={"pointer-events-auto"}
      enforceFocus={false}
      autoFocus={false}
    >
      <style>{`.rqrContentArea {
    display:            flex;
}

.rqrControlHeader { 
    color: black !important;
    padding:    10px; 
    border-bottom:1px solid darkgrey;
    display:flex
}

.rqrControlHeaderInput {
    box-sizing: border-box;
    font-size: 14pt;
    padding: 3px;
    left: 18px;
    width:  570px;
    height: 35px;
    border: 1px solid white;
    background-color: rgba(248, 246, 246, 0.938);
}

input[type=text]:focus{
  outline: 1px solid lightgrey;
}


.rqrContentAreaSideBar {
    border-right:   1px solid lightgrey; 
    width:          150px;
    padding-top:     10px;
}

.rqrContentAreaTopics {
    width:              100%;
    height:             400px;
    margin-top:         24px;
    overflow:           scroll; 
    scrollbar-width:    10px; 
    color:              black !important;
}

::-webkit-scrollbar {
    overflow: visible;
    width: 10px;
}
::-webkit-scrollbar-thumb {
    background-color: rgba(0,0,0,.2);
    background-clip: padding-box;
    border: solid transparent;
    border-width: 1px 1px 1px 6px;
    min-height: 28px;
    padding: 100px 0 0; 
    -webkit-box-shadow: inset 1px 1px 0 rgba(0,0,0,.1), inset 0 -1px 0 rgba(0,0,0,.07);
    box-shadow: inset 1px 1px 0 rgba(0,0,0,.1), inset 0 -1px 0 rgba(0,0,0,.07); 
}

.rqrTopicList {
    padding-top:        4px;
}

.rqrTopicListItem {
    color:              black !important;
    padding-left:       3px;
    font-size:          12px; 
}

.rqrTopicActive {
    padding-left:       3px;
    font-size:          12px; 
    color: #1a73e8 !important;
    font-weight: bold;
}

.rqrTopic  {
    margin-left: 10px;
    margin-right: 10px;
}

.rqrTopicHeader {
    color:              black !important;
    font-weight:    bold; 
    margin-bottom: 10px;
}

.rqrTopicTable {
    width:              100%;
    border-collapse:    collapse;
    margin-bottom:      15px;
}

.rqrTopicTableHeader {
    text-align:         left;
    font-style:        italic;
    font-size:          10px;
    color:              grey !important;
}

.rqrTableRow {
    color:              black !important;
/*     border-bottom:  1px dashed lightgrey;  */
    width:          100%;
    table-layout:   fixed;overflow-wrap: break-word;
}

.rqrTableRow:nth-child(odd) {
    background:   #f7f7f7;
}

.rqrTableRow, td {
    color:              black !important;
    padding-top:    4px; 
    padding-bottom: 4px;
    padding-right:  5px;
    vertical-align: top;
}`}</style>
      <div className={Classes.DRAWER_BODY} id={"workbench-quickref-drawer"}>
        <div ref={observerRef}>
          <div className="rqrControlHeader">
            <input
              autoFocus
              className="rqrControlHeaderInput"
              placeholder="Search..."
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div>
            <div className="rqrContentArea">
              <div className="rqrContentAreaSideBar">
                <div style={{ marginTop: 10, marginRight: 5 }}>
                  {copyRefs.map((topic, index) => (
                    <div>
                      <div className="rqrTopicList" key={topic.topic}>
                        <div
                          className={
                            index == 0 ? "rqrTopicActive" : "rqrTopicListItem"
                          }
                          onClick={(e) => {
                            const topicId = topic.id;
                            document
                              .querySelectorAll(".rqrTopicActive")
                              .forEach(function (oldE) {
                                oldE.className = "rqrTopicListItem";
                              });
                            (e.target as HTMLDivElement).className =
                              "rqrTopicActive";
                            document
                              .getElementById(`rqrTopicHeader-${topicId}`)
                              .scrollIntoView();
                          }}
                          onMouseOver={function (e) {
                            (e.target as HTMLDivElement).style.backgroundColor =
                              "#f2f2f2";
                          }}
                          onMouseLeave={function (e) {
                            (e.target as HTMLDivElement).style.backgroundColor =
                              "inherit";
                          }}
                        >
                          {topic.topic}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rqrContentAreaTopics">
                {copyRefs.map((topic, index) => (
                  <div className="rqrTopic" key={topic.topic}>
                    <div
                      className="rqrTopicHeader"
                      id={`rqrTopicHeader-${topic.id}`}
                    >
                      {topic.topic}
                    </div>
                    <table className="rqrTopicTable">
                      {topic.type == "keyboard" && (
                        <>
                          <tr className="rqrTopicTableHeader">
                            <td
                              dangerouslySetInnerHTML={{
                                __html: topic.header?.c1,
                              }}
                            />
                            <td
                              dangerouslySetInnerHTML={{
                                __html: topic.header?.c2,
                              }}
                            />
                            <td
                              dangerouslySetInnerHTML={{
                                __html: topic.header?.c3,
                              }}
                            />
                          </tr>
                          {topic.items.map((item) => (
                            <tr className="rqrTableRow" key={item.c1}>
                              <td
                                style={{ width: "40%" }}
                                dangerouslySetInnerHTML={{
                                  __html: item.c1,
                                }}
                              />
                              <td
                                style={{ width: "30%" }}
                                dangerouslySetInnerHTML={{
                                  __html: item.c2,
                                }}
                              />
                              <td
                                style={{ width: "30%" }}
                                dangerouslySetInnerHTML={{
                                  __html: item.c3,
                                }}
                              />
                            </tr>
                          ))}
                        </>
                      )}
                      {topic.type === "feature" &&
                        topic.items.map((item) => (
                          <tr key={item.c1} className="rqrTableRow">
                            <td style={{ width: "25%" }}>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: item.c1,
                                }}
                              />
                            </td>
                            <td style={{ width: "75%" }}>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: item.c2,
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      {topic.type == "featurecenter" &&
                        topic.items.map((item) => (
                          <tr className="rqrTableRow" key={item.c1}>
                            <td style={{ width: "50%" }}>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: item.c1,
                                }}
                              />
                            </td>
                            <td style={{ width: "50%" }}>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: item.c2,
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      {topic.type == "example" &&
                        topic.items.map((item) => (
                          <tr key={item.c1} className="rqrTableRow">
                            <td style={{ width: "100%" }}>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: item.c1,
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                    </table>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

const toggleQuickReference = () => {
  if (!document.getElementById("workbench-quickref-drawer"))
    renderOverlay({
      Overlay: QuickRefOverlay,
    });
};

const queryNonCodeBlocks = `[:find (count ?s) . :with ?e  :where [?e :block/string ?s]  
					(not (or [(clojure.string/starts-with? ?s "${String.fromCharCode(
            96,
            96,
            96
          )}")] 
									 [(clojure.string/starts-with? ?s "{{")]
 	 								 [(clojure.string/starts-with? ?s "<%")]
									 [(clojure.string/starts-with? ?s"> ")]
									 [(clojure.string/starts-with? ?s"[[>]] ")]										 
  								 [(clojure.string/starts-with? ?s ":q ")]))]`;

const queryNonCodeBlockWords = `[:find (sum ?n) :with ?e :where (or-join [?s ?e]
	            (and [?e :block/string ?s]
								(not (or [(clojure.string/starts-with? ?s "${String.fromCharCode(96, 96, 96)}")]
												[(clojure.string/starts-with? ?s "{{")]
												[(clojure.string/starts-with? ?s "<%")]
												[(clojure.string/starts-with? ?s"> ")]
												[(clojure.string/starts-with? ?s"[[>]] ")]										 
												[(clojure.string/starts-with? ?s ":q ")])))
								[?e :node/title ?s])
							[(re-pattern "${String.fromCharCode(91, 92, 92, 119, 39, 93, 43)}") ?pattern]
							[(re-seq ?pattern ?s) ?w]
							[(count ?w) ?n]]`;

const queryNonCodeBlockCharacters = `[:find (sum ?size) . :with ?e :where  
					(or-join [?s ?e] (and [?e :block/string ?s] 
					(not (or [(clojure.string/starts-with? ?s "${String.fromCharCode(
            96,
            96,
            96
          )}")] 
									 [(clojure.string/starts-with? ?s "{{")]
 	 								 [(clojure.string/starts-with? ?s "<%")]
									 [(clojure.string/starts-with? ?s"> ")]
									 [(clojure.string/starts-with? ?s"[[>]] ")]										 
  								 [(clojure.string/starts-with? ?s ":q ")]))) 
					[?e :node/title ?s]) [(count ?s) ?size]]`;

const queryCodeBlocks = `[:find (count ?s) . :with ?e  :where [?e :block/string ?s] 
					(or  [(clojure.string/starts-with? ?s "${String.fromCharCode(96, 96, 96)}")]
							 [(clojure.string/starts-with? ?s "{{")]
							 [(clojure.string/starts-with? ?s "<%")]
							 [(clojure.string/starts-with? ?s ":q ")])]`;

const queryCodeBlockCharacters = `[:find (sum ?size) . :with ?e :where [?e :block/string ?s] 
					(or  [(clojure.string/starts-with? ?s "${String.fromCharCode(96, 96, 96)}")]
							 [(clojure.string/starts-with? ?s "{{")]
							 [(clojure.string/starts-with? ?s "<%")]
							 [(clojure.string/starts-with? ?s ":q ")]) 
					[(count ?s) ?size]]`;

const queryBlockquotes = `[:find (count ?s) . :with ?e :where [?e :block/string ?s](or [(clojure.string/starts-with? ?s"[[>]] ")] [(clojure.string/starts-with? ?s"> ")])]`;

let queryBlockquotesWords = `[:find (sum ?n) :with ?e :where (or-join [?s ?e]
	            (and [?e :block/string ?s]
								(or [(clojure.string/starts-with? ?s"> ")]
										[(clojure.string/starts-with? ?s"[[>]] ")]))
							[?e :node/title ?s])
							[(re-pattern "${String.fromCharCode(91, 92, 92, 119, 39, 93, 43)}") ?pattern]
							[(re-seq ?pattern ?s) ?w]
							[(count ?w) ?n]]`;

const queryBlockquotesCharacters = `[:find (sum ?size) . :with ?e :where (or-join [?s ?e]
								(and [?e :block/string ?s]
								(or [(clojure.string/starts-with? ?s"> ")]
										[(clojure.string/starts-with? ?s"[[>]] ")]))
								[?e :node/title ?s])
								[(count ?s) ?size]]`;

const queryFireBaseAttachements = `[:find (count ?e) . :where [?e :block/string ?s][(clojure.string/includes? ?s "https://firebasestorage.googleapis.com")]]`;

const queryExternalLinks = `[:find (count ?e) . :where [?e :block/string ?s] (not [(clojure.string/includes? ?s "https://firebasestorage.googleapis.com")]) (or [(clojure.string/includes? ?s "https://")] [(clojure.string/includes? ?s "https://")])]`;

const StatsDrawer = ({ onClose, isOpen }: RoamOverlayProps<{}>) => {
  return (
    <Drawer
      onClose={onClose}
      isOpen={isOpen}
      title={"Graph Database stats"}
      position={"right"}
      hasBackdrop={false}
      canOutsideClickClose={false}
      style={{ width: 400 }}
      portalClassName={"pointer-events-none"}
      className={"roamjs-workbench-stats-drawer pointer-events-auto"}
      enforceFocus={false}
      autoFocus={false}
    >
      <div
        className={`${Classes.DRAWER_BODY} p-5 text-white text-opacity-70`}
        style={{ background: "#565c70" }}
      >
        <style>{`.roamjs-workbench-stats-drawer .bp3-drawer-header { 
  background: #565c70;
}

.roamjs-workbench-stats-drawer .bp3-drawer-header .bp3-heading {
  color: white; 
  opacity: 0.7; 
}`}</style>
        <p>
          Pages:{" "}
          {
            window.roamAlphaAPI.q(
              "[:find (count ?p) :where [?p :node/title _]]"
            )[0]
          }
        </p>
        <p>
          Text Blocks / Words / Characters: <br />
          {window.roamAlphaAPI.q(queryNonCodeBlocks)} /
          {window.roamAlphaAPI.q(queryNonCodeBlockWords)} /
          {window.roamAlphaAPI.q(queryNonCodeBlockCharacters)}
        </p>
        <p>
          <a
            style={{ color: "lightgrey" }}
            onClick={() =>
              window.roamAlphaAPI.ui.mainWindow.openPage({
                page: { title: ">" },
              })
            }
          >
            Block Quotes
          </a>{" "}
          / Words / Characters: <br />
          {window.roamAlphaAPI.q(queryBlockquotes)} /{" "}
          {window.roamAlphaAPI.q(queryBlockquotesWords)} /{" "}
          {window.roamAlphaAPI.q(queryBlockquotesCharacters)}
        </p>
        <p>
          Code Blocks / Characters:
          <br />
          {window.roamAlphaAPI.q(queryCodeBlocks)} /
          {window.roamAlphaAPI.q(queryCodeBlockCharacters)}
        </p>
        <p>
          Interconnections (refs):
          {window.roamAlphaAPI.q(
            "[:find (count ?r) . :with ?e :where [?e :block/refs ?r] ]]"
          )}
        </p>
        <p className="flex flex-col">
          {[
            "TODO",
            "DONE",
            "query",
            "embed",
            "table",
            "kanban",
            "video",
            "roam/js",
          ].map((tag) => (
            <span key={tag}>
              <a
                style={{ color: "lightgrey" }}
                onClick={() =>
                  window.roamAlphaAPI.ui.mainWindow.openPage({
                    page: { title: tag },
                  })
                }
              >
                {tag}
              </a>
              :{" "}
              {window.roamAlphaAPI.q(
                `[:find (count ?be) . :where [?e :node/title "${tag}"][?be :block/refs ?e]]`
              ) || 0}
            </span>
          ))}
        </p>
        <p>
          Firebase Links:{" "}
          {window.roamAlphaAPI.q(queryFireBaseAttachements) || 0}
          <br />
          External Links: {window.roamAlphaAPI.q(queryExternalLinks) || 0}
        </p>
        <p>
          Display Name: {getCurrentUserDisplayName()}
          <br />
          Email: {getCurrentUserEmail()}
          <br />
        </p>
      </div>
    </Drawer>
  );
};

const displayGraphStats = async () => {
  if (!document.getElementById("workbench-stats-drawer"))
    renderOverlay({
      Overlay: StatsDrawer,
    });
};

const keyDownListener = (ev: KeyboardEvent) => {
  if (ev.shiftKey == true && ev.code == "KeyQ") {
    if (ev.ctrlKey) {
      ev.preventDefault();
      ev.stopPropagation();
      toggleQuickReference();
    }
    if (ev.altKey) {
      ev.preventDefault();
      ev.stopPropagation();
      showTutorials();
    }
  }
  if (ev.altKey && ev.shiftKey == true && ev.code == "KeyB") {
    ev.preventDefault();
    ev.stopPropagation();
    displayGraphStats();
  }
};

const WorkbenchMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = useCallback(() => setIsOpen(false), [setIsOpen]);

  const menuItems = [
    {
      enabled: dnpEnabled,
      onClick: dnpComponent.toggleVisible,
      icon: "timeline-events",
      label: "Daily Notes",
      shortcut: "Alt-Shift-,",
    },
    {
      enabled: deepNavEnabled,
      onClick: triggerDeepNav,
      icon: "circle-arrow-right",
      label: "Deep Nav",
      shortcut: "OPT+g",
    },
    {
      enabled: typeAheadEnabled,
      onClick: typeAheadLookup,
      icon: "manual",
      label: "Dictionary",
      shortcut: "Alt-Shift-.",
    },
    {
      enabled: formatConverterEnabled,
      onClick: formatConverterShow,
      icon: "fork",
      label: "Format Converter",
      shortcut: "Alt-m",
    },
    {
      enabled: formatConverterEnabled,
      onClick: htmlview,
      icon: "document-share",
      label: "Format Web View",
      shortcut: "Alt-Shift-m",
    },
    {
      enabled: privacyEnabled,
      onClick: privacyToggle,
      icon: "shield",
      label: "Privacy Mode",
      shortcut: "Alt-Shift-p",
    },
    {
      enabled: true,
      onClick: toggleQuickReference,
      icon: "help",
      label: "Help",
      shortcut: "Ctrl-Shift-q",
    },
    {
      enabled: true,
      onClick: showTutorials,
      icon: "learning",
      label: "Tutorials",
      shortcut: "Alt-Shift-q",
    },
    {
      enabled: true,
      onClick: displayGraphStats,
      icon: "database",
      label: "Graph DB Stats",
      shortcut: "Alt-Shift-b",
    },
  ] as const;

  return (
    <Popover
      isOpen={isOpen}
      onClose={closeMenu}
      target={
        <Tooltip content={"WorkBench Help"}>
          <Button
            icon={"vertical-distribution"}
            onClick={() => setIsOpen(true)}
            minimal
          />
        </Tooltip>
      }
      content={
        <>
          <Menu>
            {menuItems
              .filter(({ enabled }) => enabled)
              .map((mi) => (
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    mi.onClick();
                  }}
                  text={
                    <>
                      <Icon icon={mi.icon} className={"mr-2"} />
                      {mi.label}{" "}
                      <span style={{ fontSize: "7pt" }}>({mi.shortcut})</span>
                    </>
                  }
                />
              ))}
          </Menu>
          <Divider />
          <div
            style={{
              paddingTop: 4,
              paddingBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: "8pt",
                paddingLeft: "15px",
              }}
            >
              WorkBench {version}
            </span>
          </div>
        </>
      }
    />
  );
};

const displayMenu = () => {
  if (document.getElementById("workbench-menu")) return;
  const parent = document.createElement("div");
  parent.id = "workbench-menu";
  const roamTopbar = document.querySelectorAll(
    ".rm-topbar .bp3-popover-wrapper"
  );
  const positionInToolbar =
    document.querySelector(".rm-topbar .bp3-icon-menu-closed")?.children
      .length > 0
      ? 2
      : 1;
  const nextIconButton = roamTopbar[roamTopbar.length - positionInToolbar];
  nextIconButton.insertAdjacentElement("afterend", parent);

  ReactDOM.render(<WorkbenchMenu />, parent);
};

let version = "";
export const setVersion = (v: string) => {
  version = v;
};

const workbenchCommands = new Set<() => void>();
let topbarObserver: MutationObserver;
export let enabled = false;
export const toggleFeature = (flag: boolean) => {
  enabled = flag;
  if (flag) {
    displayMenu();
    topbarObserver = new MutationObserver(() => {
      // fix from sidebar moving
    });
    workbenchCommands.add(addCommand("WorkBench Help", toggleQuickReference));
    workbenchCommands.add(addCommand("Tutorials", showTutorials));
    workbenchCommands.add(addCommand("Graph DB Stats", displayGraphStats));
    document.body.addEventListener("keydown", keyDownListener);
  } else {
    const workbenchMenu = document.getElementById("workbench-menu");
    if (workbenchMenu) {
      workbenchMenu.remove();
      ReactDOM.unmountComponentAtNode(workbenchMenu);
      topbarObserver.disconnect();
    }
    workbenchCommands.forEach((r) => r());
    workbenchCommands.clear();
    document.body.removeEventListener("keydown", keyDownListener);
  }
};
