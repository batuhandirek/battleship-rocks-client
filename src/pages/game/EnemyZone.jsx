import { useRef } from "react";

import { SIZE_CONFIG } from "../../constants/GAME";
import { Grid } from "./Grid";
import { Ship } from "./Ship";

export function EnemyZone(props) {
  const log = useRef()

  const onMove = ({ row, col, shot, destroyedShip }) => {
    log.current.log(
      `You shot at ${row}-${col} and ${shot ? "hit!" : "missed."} ` +
        `${!!destroyedShip ? "You destroyed a ship!" : ""}`,
    );
  };


    const shipsToRender = SIZE_CONFIG[props.rowCount].availableShips.map(
      (size) => ({ size, destroyed: false }),
    );

    for (const destroyedShip of props.destroyedShips) {
      const shipIndex = shipsToRender.findIndex(
        (ship) => !ship.destroyed && ship.size === destroyedShip.size,
      );
      shipsToRender[shipIndex].destroyed = true;
    }

    return (
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
            ref={log}
          />
        </box>
        {/* GRID */}
        <box width="33%" left="33%">
          <box left="center">
            <Grid
              board={props.boardStatus}
              isInput
              isShooting={props.isShooting}
              onMove={props.onMove}
              size={props.rowCount}
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
    );

}
