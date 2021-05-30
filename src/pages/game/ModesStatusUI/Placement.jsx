import { useGameCtx } from "../gameContext";

export function Placement() {
  const {
    state: { placementConfirmed, placementFailed, enemyPlacementConfirmed },
  } = useGameCtx();
  return (
    <div>
      <box left="20%" width="20%">
        <text top="center" left="center">
          {placementConfirmed
            ? "You have placed your fleet!"
            : placementFailed
            ? "Failed to submit the placement of your fleet"
            : "Waiting for you to place your fleet"}
        </text>
      </box>
      <box left="60%" width="20%">
        <text top="center" left="center">
          {enemyPlacementConfirmed
            ? "Enemy has placed their fleet!"
            : "Waiting for enemy to place their fleet"}
        </text>
      </box>
    </div>
  );
}
