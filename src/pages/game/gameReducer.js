import { debug } from "../../lib/screen";

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
  SET_GAME_SIZE: "set_game_size"
};

export const gameInitialState = {
  gameId: null,
  gamePassword: null,
  error: null,
  stage: MODES.MODE_SELECTION,
  isGamePrivate: null,
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
  // When the game is ENDED
  hasWon: false,
  hasOpponentLeft: false,
};

export function gameReducer(state = gameInitialState, action) {
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
        stage: "SIZE_SELECTION",
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
      };
    }
    case gameActionTypes.OPPONENT_READY:
      return {
        ...state,
        enemyPlacementConfirmed: true,
      };
    case gameActionTypes.SET_TURN:
      return {
        ...state,
        stage: MODES.PLAYING,
        turn,
      };
    case gameActionTypes.PLAYER_MOVE: {
      const {
        turn,
        playerId: previousMoveUser,
        shot: previousMoveShot,
      } = action.payload;
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
      const { gameSize, stage } = action.payload
      return {
        ...state,
        gameSize,
        stage
      }
    }
    default:
      throw new Error();
  }
}

export const actions = {
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
      hasWon
    }
  },
  setGameSize(payload) {
    return {
      type: gameActionTypes.SET_GAME_SIZE,
      payload,
    };
  },
};
