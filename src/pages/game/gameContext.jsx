import { createContext , useContext, useReducer} from "react";
import { gameActionTypes, gameActions, gameReducer, gameInitialState } from "./gameReducer";

const GameContext = createContext({})

export const MENU_MAP = {
  ["Find an opponent"]: gameActionTypes.MATCH,
  ["Create a private game"]: gameActionTypes.CREATE,
  ["Join a private game"]: gameActionTypes.JOIN,
  ["<- Go back"]: "back",
};

export function GameContextProvider({ children }) {
  const [gameState, dispatch] = useReducer(gameReducer, gameInitialState);

  const contextVal = {
    state: gameState,
    dispatch,
  }

  return (
    <GameContext.Provider value={contextVal}>
      {children}
    </GameContext.Provider>
  )
}

export function useGameCtx() {
  const gameContext = useContext(GameContext)

  if (!gameContext) {
    throw new Error('useGameCtx should be used within a GameContextProvider')
  }

  return gameContext
}
