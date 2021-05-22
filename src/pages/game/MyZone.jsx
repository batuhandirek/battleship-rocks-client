import { useRef, useState } from "react";
import * as _ from "lodash";

import {
  getShipAtCoordinate,
  getShipCoordinateArray,
  randomizeBoard,
} from "../../lib/util";

import { Ship } from "./Ship";
import { Grid } from "./Grid";

export function MyZone(props) {
  const [state, setState] = useState(() => {
    const { board, ships } = randomizeBoard(props.rowCount);
    return {
      boardStatus: board,
      ships,
    };
  });
  const formationMenu = useRef();
  const log = useRef();

  // Ship placement
  const handleRandomizeBoard = (iter = 0) => {
    const { board, ships } = randomizeBoard(props.rowCount);
    setState((state) => ({
      ...state,
      boardStatus: board,
      ships,
    }));
  };

  // Handlers
  const handleFormationMenuSelect = ({ content }) => {
    if (content.includes("Random")) handleRandomizeBoard();
    if (content.includes("Accept")) {
      props.onSubmitFormation({
        ships: state.ships.map((s) => ({
          row: s.row,
          col: s.col,
          size: s.size,
          direction: s.direction,
        })),
      });
    }
  };

  // Called by Game.jsx
  const onMove = ({ row, col, shot, destroyedShip }) => {
    const newBoard = _.cloneDeep(state.boardStatus);
    const newShips = _.cloneDeep(state.ships);
    const shipHit = getShipAtCoordinate({ ships: newShips, row, col });
    // Increment ship
    if (shipHit) {
      const shipIndex = newShips.findIndex((s) => s.id === shipHit.id);
      newShips[shipIndex].hit = (newShips[shipIndex].hit || 0) + 1;
      newShips[shipIndex].destroyed =
        newShips[shipIndex].hit === newShips[shipIndex].size;
    }
    // Change coordinates
    if (destroyedShip) {
      const coords = getShipCoordinateArray(destroyedShip);
      coords.forEach(({ row, col }) => {
        newBoard[row][col] = 3;
      });
    } else {
      newBoard[row][col] = shot ? 2 : 4;
    }
    setState((state) => ({
      ...state,
      boardStatus: newBoard,
      ships: newShips,
    }));
    log.current.log(
      `Enemy shot at ${row}-${col} and ${shot ? "hit!" : "missed."} ` +
        `${!!destroyedShip ? "A ship is destroyed!" : ""}`,
    );
  };
  const focusFormationMenu = () => {
    if (formationMenu.current) formationMenu.current.focus();
  };

  return (
    <box width="100%" height="100%">
      {/* FORMATION MENU - MOVE LOG */}
      <box width="33%">
        {!props.placementConfirmed && (
          <list
            ref={formationMenu}
            onSelect={handleFormationMenuSelect}
            keys={true}
            right={0}
            top={0}
            width={20}
            height={4}
            border="line"
            style={{
              fg: "blue",
              bg: "default",
              border: {
                fg: "default",
                bg: "default",
              },
              selected: {
                bg: "green",
              },
            }}
            invertSelected={true}
            items={["Randomize ships", "Accept formation"]}></list>
        )}
        {props.placementConfirmed && (
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
        )}
      </box>
      {/* GRID */}
      <box width="33%" left="33%">
        <box left="center">
          <Grid board={state.boardStatus} size={props.rowCount} />
        </box>
      </box>
      {/* FLEET */}
      <box width="33%" left="66%">
        <text>Your fleet</text>
        {state.ships.map((ship, index) => (
          <Ship
            key={`${ship.id}-${ship.hit}`}
            size={ship.size}
            style={{ top: 2 + index * 3 }}
            damage={ship.hit}
          />
        ))}
      </box>
    </box>
  );
}
