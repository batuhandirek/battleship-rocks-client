import * as _ from "lodash";
import { nanoid } from "nanoid";
import * as process from "process";
import { SIZE_CONFIG } from "../constants/GAME";

export const generateEmptyBoard = (size) => {
  return new Array(size)
    .fill(1)
    .map(() => new Array(size).fill(1).map(() => 0));
};

export const getShipCoordinateArray = ({ row, col, size, direction }) => {
  const positions = [];
  if (direction === "horz") {
    new Array(size).fill(1).forEach((_, index) => {
      positions.push({ row, col: col + index });
    });
  } else {
    new Array(size).fill(1).forEach((_, index) => {
      positions.push({ row: row + index, col: col });
    });
  }
  return positions;
};

export const paintBoard = (board, { row, col, size, direction }, value) => {
  if (direction === "horz") {
    new Array(size).fill(1).forEach((_, index) => {
      if ([row, col + index].some((i) => i < 0 || i >= board.length))
        return board;
      board[row][col + index] = value;
    });
  } else {
    new Array(size).fill(1).forEach((_, index) => {
      if ([col, row + index].some((i) => i < 0 || i >= board.length))
        return board;
      board[row + index][col] = value;
    });
  }
  return _.cloneDeep(board);
};

export const replaceValues = (board, from, to) => {
  board.forEach((row, rowIndex) =>
    row.forEach((cell, colIndex) => {
      if (board[rowIndex][colIndex] === from) board[rowIndex][colIndex] = to;
    }),
  );
  return board;
};

export const getShipAtCoordinate = ({ ships, row, col }) => {
  return ships.find(
    (ship) =>
      (ship.direction === "horz" &&
        ship.row === row &&
        col - ship.col >= 0 &&
        col - (ship.col + ship.size - 1) <= 0) ||
      (ship.direction === "vert" &&
        ship.col === col &&
        row - ship.row >= 0 &&
        row - (ship.row + ship.size - 1) <= 0),
  );
};

export const placeShip = (board, size) => {
  const direction = Math.random() < 0.5 ? "horz" : "vert";
  const boardState = _.cloneDeep(board);

  let possible = [];

  if (direction === "horz") {
    let rowIndex = 0;
    for (const row of boardState) {
      for (let i = 0; i <= boardState.length - size - 1; i++) {
        const slice = row.slice(i, i + size);
        const isValid = slice.every((el) => el === 0);
        if (isValid) possible.push({ row: rowIndex, col: i });
      }
      rowIndex = rowIndex + 1;
    }
  } else {
    for (let col = 0; col < boardState.length; col++) {
      for (let row = 0; row <= boardState.length - size; row++) {
        const slice = new Array(size)
          .fill(1)
          .map((o, index) => boardState[row + index][col]);
        const isValid = slice.every((el) => el === 0);
        if (isValid) possible.push({ row, col });
      }
    }
  }

  if (possible.length === 0) throw new Error("no-possible-place");
  const placed = _.sample(possible);
  // Paint the ship
  let newBoard = paintBoard(boardState, { size, direction, ...placed }, 1);

  // Block the surrounding of the ship so that we won't put another ship adjacent to it
  const vertSizeDelete = direction === "horz" ? 3 : size + 2;
  const horzSizeDelete = direction === "horz" ? size : 1;
  newBoard = paintBoard(
    newBoard,
    {
      size: vertSizeDelete,
      direction: "vert",
      row: placed.row - 1,
      col: placed.col - 1,
    },
    5,
  );
  newBoard = paintBoard(
    newBoard,
    {
      size: vertSizeDelete,
      direction: "vert",
      row: placed.row - 1,
      col: placed.col + horzSizeDelete,
    },
    5,
  );
  newBoard = paintBoard(
    newBoard,
    {
      size: horzSizeDelete,
      direction: "horz",
      row: placed.row - 1,
      col: placed.col,
    },
    5,
  );
  newBoard = paintBoard(
    newBoard,
    {
      size: horzSizeDelete,
      direction: "horz",
      row: placed.row + vertSizeDelete - 2,
      col: placed.col,
    },
    5,
  );

  return {
    board: newBoard,
    ship: { size, direction, ...placed },
  };
};

export const randomizeBoard = (rowCount, iter = 0) => {
  if (iter === 50) process.exit(100);
  try {
    const ships = [];
    let board = generateEmptyBoard(rowCount);
    for (const shipSize of SIZE_CONFIG[rowCount].availableShips) {
      const result = placeShip(board, shipSize);
      ships.push({
        id: nanoid(),
        hit: 0,
        ...result.ship,
      });
      board = result.board;
    }
    board = replaceValues(board, 5, 0);
    return { board, ships };
  } catch (e) {
    if (e.message === "no-possible-place")
      return randomizeBoard(rowCount, iter + 1);
  }
};

export const delay = async (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function changeCoordOnBoard(board, destroyedShip, row, col, shot) {
  const newBoard = _.cloneDeep(board);
  if (destroyedShip) {
    const coords = getShipCoordinateArray(destroyedShip);
    coords.forEach(({ row: coordRow, col: coordCol }) => {
      newBoard[coordRow][coordCol] = 3;
    });
  } else {
    newBoard[row][col] = shot ? 2 : 4;
  }

  return newBoard
}
