import { useRef, useEffect } from "react";
import { useAppCtx } from "../../appContext";


const LINES = [
  { text: "Game Objective", type: "head" },
  {
    text: `Battleship is a turn based game where the goal is to try and sink opponent's ships before they sink your ships.`,
    type: "text",
  },
  { text: ``, type: "text" },
  { text: "Game Rules", type: "head" },
  { text: "All of the ships must be placed.", type: "bullet" },
  { text: "Ships cannot overlap when placing.", type: "bullet" },
  { text: "Ships cannot be placed diagonally.", type: "bullet" },
  { text: "Turns change only when a player misses.", type: "bullet" },
  { text: ``, type: "text" },
  { text: "Game Play", type: "head" },
  {
    text: "After a match is found, both players are required to submit their fleet formation.",
    type: "bullet",
  },
  {
    text: "When formations are submitted, a random player is selected to make the first move.",
    type: "bullet",
  },
  {
    text: "Successful hits result in another shot given to the same player.",
    type: "bullet",
  },
  {
    text: "The turn changes to the other player when a shot is missed.",
    type: "bullet",
  },
  { text: "Game will end when all ships are destroyed.", type: "bullet" },
];

export function Howto() {
  const button = useRef(null);
  const { navigateTo } = useAppCtx()

  useEffect(() => {
    button.current.focus();
  });

  function onBack() {
    navigateTo("home");
  }

  return (
    <box width="100%" height="100%">
      <box height="50%" left="center" top="center">
        {LINES.map((l, index) => (
          <text
            key={`${l.text}-${index}`}
            top={index * 2}
            left={l.type === "bullet" ? 8 : 0}
            style={{
              underline: l.type === "head",
              fg: l.type === "head" ? "green" : "white",
            }}
            content={`${l.type === "bullet" ? "-" : ""} ${l.text}`}
          />
        ))}
      </box>
      <button
        ref={button}
        top="80%"
        left="center"
        width={15}
        height={1}
        onPress={onBack}
        keys={true}>
        <box
          align="center"
          style={{ bold: true, bg: "green", fg: "white" }}
          content={`Go back`}
          bold></box>
      </button>
    </box>
  );
}
