import { useAppCtx } from "../../appContext";

import { SIZE_CONFIG } from "../../constants/GAME";
import { useGameCtx } from "./gameContext";
import { gameActions, MODES } from "./gameReducer";
import { Grid } from "./Grid";
import { Ship } from "./Ship";

export function EnemyZone({ isShooting, logRef }) {
  const {
    state: {
      stage,
      turn,
      isSubmitting,
      gameId,
      gameSize,
      opponentBoardStatus,
      opponentDestroyedShips,
    },
    dispatch
  } = useGameCtx();
  const { api, userId, token } = useAppCtx();

  const handleSubmitMove = async (row, col) => {
    if (stage !== MODES.PLAYING) return;
    if (turn !== userId) return;
    if (isSubmitting) return;
    else {
      dispatch(gameActions.setIsSubmitting(true));

      await api.moveSubmit({
        token,
        gameId,
        row,
        col,
      });
      // TODO: Needs to be done async
      dispatch(gameActions.setIsSubmitting(false));
    }
  };

  const shipsToRender = SIZE_CONFIG[gameSize].availableShips.map((size) => ({
    size,
    destroyed: false,
  }));

  for (const destroyedShip of opponentDestroyedShips) {
    const shipIndex = shipsToRender.findIndex(
      (ship) => !ship.destroyed && ship.size === destroyedShip.size,
    );
    shipsToRender[shipIndex].destroyed = true;
  }

  return (
    <box top="55%" width="100%" height="45%">
      <box
        label={"Opponent board"}
        border={{ type: "line" }}
        style={{ border: { fg: "blue" } }}
        width="100%"
        height="100%"
        left="center"
        top="center">
        <box width="100%-2" left="0" height="100%-2">
          <box width="100%" height="100%">
            {/* MOVE LOG*/}
            <box width="33%" left="0">
              <log
                width="80%"
                height="80%"
                left="center"
                top="center"
                border={{ type: "line" }}
                style={{ border: { fg: "blue" } }}
                scrollbar={{
                  track: { bg: "yellow" },
                  style: { inverse: true },
                }}
                mouse={true}
                ref={logRef}
              />
            </box>
            {/* GRID */}
            <box width="33%" left="33%">
              <box left="center">
                <Grid
                  board={opponentBoardStatus}
                  isInput
                  isShooting={isShooting}
                  onMove={handleSubmitMove}
                  size={gameSize}
                />
              </box>
            </box>
            {/* FLEET */}
            <box left="66%" width="33%">
              <text>Enemy fleet</text>
              {shipsToRender.map((ship, index) => (
                <Ship
                  key={`${ship.size}-${index}`}
                  size={ship.size}
                  style={{ top: 2 + index * 3 }}
                  damage={ship.destroyed ? ship.size : 0}
                />
              ))}
            </box>
          </box>
        </box>
      </box>
    </box>
  );
}
