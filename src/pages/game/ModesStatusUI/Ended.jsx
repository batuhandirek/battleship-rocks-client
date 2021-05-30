import { useGameCtx } from "../gameContext";

export function Ended() {
  const {
    state: { hasOpponentLeft, hasWon },
  } = useGameCtx();
  return (
    <box left="center" top="center">
      <box top={0} height="50%" left="center" width="100%">
        {hasOpponentLeft && (
          <text top="center" left="center">
            Your opponent has left the game!
          </text>
        )}
      </box>
      <box top="50%" height="50%" left="center" width="100%">
        <text top="center" left="center">
          {hasWon
            ? "You won the game!"
            : "You have lost this battle!" + " Going back to main menu."}
        </text>
      </box>
    </box>
  );
}
