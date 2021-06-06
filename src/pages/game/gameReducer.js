import * as _ from "lodash";

import { debug } from "../../lib/screen";
import {
  changeCoordOnBoard,
  generateEmptyBoard,
  randomizeBoard,
  getShipAtCoordinate
} from "../../lib/util";

// MODE_SELECTION
//   Public: SIZE_SELECTION MATCHING
//   Private: SELECTION
// Create: SIZE_SELECTION - CREATING - WAITING
// Join:   AWAITING_PASSWORD - JOINING
// PLACEMENT - PLAYING - ENDED
export const MODES = {
  MODE_SELECTION: "MODE_SELECTION",
  SIZE_SELECTION: "SIZE_SELECTION",
  AWAITING_PASSWORD: "AWAITING_PASSWORD",
  JOINING: "JOINING",
  PLACEMENT: "PLACEMENT",
  CREATING: "CREATING",
  MATCHING: "MATCHING",
  WAITING: "WAITING",
  PLAYING: "PLAYING",
  ENDED: "ENDED",
  PRIVATE_GAME_SUCCESS: "PRIVATE_GAME_SUCCESS",
};

export const gameActionTypes = {
  MATCH: "match",
  CREATE: "create",
  JOIN: "join",
  CANCEL_JOIN: "cancel_join",
  ERROR: "error",
  JOINING: "joining",
  JOINING_ERROR: "joining_error",
  PLACEMENT_SUCCESS: "placement_success",
  PLACEMENT_ERROR: "placement_error",
  SET_IS_SUBMITTING: "set_is_submitting",
  GAME_FOUND: "game_found",
  OPPONENT_READY: "opponent_ready",
  SET_TURN: "set_turn",
  PLAYER_MOVE: "player_move",
  OPPONENT_LEFT: "opponent_left",
  GAME_FINISH: "game_finish",
  SET_GAME_SIZE: "set_game_size",
  SET_OPPONENT_IS_SHOOTING: "set_opponent_is_shooting",
  OPPONENT_MOVE: "opponent_move",
  MY_MOVE: "my_move",
  RANDOMIZE_MY_BOARD: "randomize_my_board",
};

export const gameInitialState = {
  gameId: null,
  gamePassword: null,
  error: null,
  stage: MODES.MODE_SELECTION,
  isGamePrivate: false,
  gameSize: null,
  placementConfirmed: false,
  placementFailed: false,
  enemyPlacementConfirmed: false,
  // Holds whose turn is it
  turn: null,
  isSubmitting: false,
  // To display if last hit was success
  previousMoveUser: null,
  previousMoveShot: false,
  // myZone
  myBoardStatus: generateEmptyBoard(null),
  myShips: [],

  // opponent
  opponentIsShooting: false,
  opponentBoardStatus: generateEmptyBoard(null),
  opponentDestroyedShips: [],
  // When the game is ENDED
  hasWon: false,
  hasOpponentLeft: false,
};

export function gameReducer(state = gameInitialState, action) {
  function randomizeMyBoard(gameSize = state.gameSize) {
    let board, ships;
    const randomized = randomizeBoard(gameSize);
    if (randomized) {
      ({ board, ships } = randomized);
    }
    return {
      myBoardStatus: board,
      myShips: ships,
    };
  }
  switch (action.type) {
    case gameActionTypes.MATCH:
      return {
        ...state,
        stage: MODES.SIZE_SELECTION,
        isGamePrivate: false,
      };
    case gameActionTypes.CREATE:
      return {
        ...state,
        stage: MODES.SIZE_SELECTION,
        isGamePrivate: true,
      };
    case gameActionTypes.JOIN:
      debug(`Moving to awaiting password`);
      return {
        ...state,
        stage: MODES.AWAITING_PASSWORD,
      };
    case gameActionTypes.CANCEL_JOIN:
      return {
        ...state,
        stage: MODES.MODE_SELECTION,
        error: null,
      };
    case gameActionTypes.PRIVATE_GAME_SUCCESS: {
      const {
        data: { password, gameId },
      } = action.payload;
      return {
        ...state,
        stage: "WAITING",
        gamePassword: password,
        gameId: gameId,
      };
    }
    case gameActionTypes.ERROR:
      return {
        ...state,
        error: action.payload.error,
      };
    case gameActionTypes.JOINING:
      return {
        ...state,
        error: null,
        stage: MODES.JOINING,
      };
    case gameActionTypes.JOINING_ERROR:
      return {
        ...state,
        stage: MODES.AWAITING_PASSWORD,
        error: action.payload.error,
      };
    case gameActionTypes.PLACEMENT_SUCCESS:
      return {
        ...state,
        placementFailed: false,
        placementConfirmed: true,
      };
    case gameActionTypes.PLACEMENT_ERROR:
      return {
        ...state,
        placementFailed: true,
      };
    case gameActionTypes.SET_IS_SUBMITTING:
      return {
        ...state,
        isSubmitting: action.payload.isSubmitting,
      };
    case gameActionTypes.GAME_FOUND: {
      const {
        data: { id: gameId, size: gameSize },
      } = action.payload;
      return {
        ...state,
        stage: MODES.PLACEMENT,
        gameId,
        gameSize,
        opponentBoardStatus: generateEmptyBoard(gameSize),
        ...randomizeMyBoard(gameSize),
      };
    }
    case gameActionTypes.OPPONENT_READY:
      return {
        ...state,
        enemyPlacementConfirmed: true,
      };
    case gameActionTypes.SET_TURN: {
      const { turn } = action.payload;
      return {
        ...state,
        stage: MODES.PLAYING,
        turn,
      };
    }
    case gameActionTypes.PLAYER_MOVE: {
      const { turn, previousMoveUser, previousMoveShot } = action.payload;
      return {
        ...state,
        turn,
        previousMoveUser,
        previousMoveShot,
      };
    }
    case gameActionTypes.OPPONENT_LEFT:
      return {
        ...state,
        stage: MODES.ENDED,
        hasWon: true,
        hasOpponentLeft: true,
      };
    case gameActionTypes.GAME_FINISH:
      return {
        ...state,
        stage: MODES.ENDED,
        hasWon: action.payload.hasWon,
      };
    case gameActionTypes.SET_GAME_SIZE: {
      const { gameSize, stage } = action.payload;
      return {
        ...state,
        gameSize,
        stage,
        opponentBoardStatus: generateEmptyBoard(gameSize),
        ...randomizeMyBoard(gameSize),
      };
    }
    case gameActionTypes.SET_OPPONENT_IS_SHOOTING:
      return {
        ...state,
        opponentIsShooting: action.payload.opponentIsShooting,
      };
    case gameActionTypes.OPPONENT_MOVE: {
      const { destroyedShip, row, col, shot } = action.payload;
      const newBoard = changeCoordOnBoard(
        state.opponentBoardStatus,
        destroyedShip,
        row,
        col,
        shot,
      );
      return {
        ...state,
        opponentBoardStatus: newBoard,
        opponentDestroyedShips: destroyedShip
          ? [...state.opponentDestroyedShips, destroyedShip]
          : state.opponentDestroyedShips,
      };
    }
    case gameActionTypes.MY_MOVE: {
      const { destroyedShip, row, col, shot } = action.payload;
      const newShips = _.cloneDeep(state.myShips);
      const shipHit = getShipAtCoordinate({ ships: newShips, row, col });
      // Increment ship
      if (shipHit) {
        const shipIndex = newShips.findIndex((s) => s.id === shipHit.id);
        newShips[shipIndex].hit = (newShips[shipIndex].hit || 0) + 1;
        newShips[shipIndex].destroyed =
          newShips[shipIndex].hit === newShips[shipIndex].size;
      }

      const newBoard = changeCoordOnBoard(
        state.myBoardStatus,
        destroyedShip,
        row,
        col,
        shot,
      );

      return {
        ...state,
        myBoardStatus: newBoard,
        myShips: newShips,
      };
    }
    case gameActionTypes.RANDOMIZE_MY_BOARD:
      return {
        ...state,
        ...randomizeMyBoard(),
      };
    default:
      throw new Error();
  }
}

export const gameActions = {
  error(error) {
    return {
      type: gameActionTypes.ERROR,
      payload: {
        error,
      },
    };
  },
  joiningError(error) {
    return {
      type: gameActionTypes.JOINING_ERROR,
      payload: {
        error,
      },
    };
  },
  setIsSubmitting(isSubmitting) {
    return {
      type: gameActionTypes.SET_IS_SUBMITTING,
      payload: {
        isSubmitting,
      },
    };
  },
  gameFoundAction(data) {
    return {
      type: gameActionTypes.GAME_FOUND,
      payload: {
        data,
      },
    };
  },
  privateGameSuccess(data) {
    return {
      type: gameActionTypes.PRIVATE_GAME_SUCCESS,
      payload: {
        data,
      },
    };
  },
  setTurn(turn) {
    return {
      type: gameActionTypes.SET_TURN,
      payload: {
        turn,
      },
    };
  },
  playerMove(payload) {
    return {
      type: gameActionTypes.PLAYER_MOVE,
      payload,
    };
  },
  gameFinish(hasWon) {
    return {
      type: gameActionTypes.GAME_FINISH,
      payload: {
        hasWon,
      },
    };
  },
  setGameSize(payload) {
    return {
      type: gameActionTypes.SET_GAME_SIZE,
      payload,
    };
  },
  setOpponentIsShooting(opponentIsShooting) {
    return {
      type: gameActionTypes.SET_OPPONENT_IS_SHOOTING,
      payload: {
        opponentIsShooting,
      },
    };
  },
  onOpponentMove(payload) {
    return {
      type: gameActionTypes.OPPONENT_MOVE,
      payload,
    };
  },
  onMyMove(destroyedShip) {
    return {
      type: gameActionTypes.MY_MOVE,
      payload: {
        destroyedShip,
      },
    };
  },
};
