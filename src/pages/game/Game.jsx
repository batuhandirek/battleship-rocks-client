import { useRef, useEffect, useReducer, useState } from "react";

import { EnemyZone } from "./EnemyZone";
import { MyZone } from "./MyZone";
import { Spinner } from "../../components/Spinner";
import { SIZE_CONFIG } from "../../constants/GAME";
import {
  gameReducer,
  gameInitialState,
  actions,
  gameActionTypes,
  MODES,
} from "./gameReducer";
import { AppContext } from "../../contexts";
import { getShipCoordinateArray } from "../../lib/util";
import * as _ from 'lodash'

const MENU_MAP = {
  ["Find an opponent"]: gameActionTypes.MATCH,
  ["Create a private game"]: gameActionTypes.CREATE,
  ["Join a private game"]: gameActionTypes.JOIN,
  ["<- Go back"]: "back",
};

export function Game(props) {
  const passwordInput = useRef();
  const myBoard = useRef();
  const opponentBoard = useRef();
  const socketContextRef = useRef(AppContext);
  const [opponentIsShooting, setOpponentIsShooting] = useState(false);

  const [state, dispatch] = useReducer(gameReducer, gameInitialState);

  useEffect(() => {
    socketContextRef.current.socket.on("game:found", onGameFound);

    return () => {
      if (socketContextRef.current.socket) {
        socketContextRef.current.socket.off(
          "game:opponent:ready",
          onOpponentReady,
        );
        socketContextRef.current.socket.off(
          "game:opponent:left",
          onOpponentLeft,
        );
        socketContextRef.current.socket.off("game:start", onGameStart);
        socketContextRef.current.socket.off("game:move", onGameMove);
        socketContextRef.current.socket.off("game:finished", onGameFinish);
      }
    };
  }, []);

  const handleGameSelection = ({ content }) => {
    const actionType = MENU_MAP[content];
    if (actionType === "back") {
      goHome();
    } else {
      dispatch({ type: actionType });
    }
  };

  useEffect(() => {
    if (state.isGamePrivate) {
      handleCreatePrivateGame();
    } else {
      handleFindOpponent();
    }
  }, [state.size]);

  const handleGameSizeSelection = ({ content }) => {
    const size = Number(content.split("x")[0]);
    const nextStage = state.isGamePrivate ? MODES.CREATING : MODES.MATCHING;

    dispatch(
      actions.setGameSize({
        gameSize: size,
        stage: nextStage,
      }),
    );
  };

  // SENDING SOCKET MESSAGES
  // Discover game
  const handleFindOpponent = async () => {
    await socketContextRef.current.api.findGame({
      size: state.gameSize,
      token: socketContextRef.current.token,
    });
  };

  const handleFindCancel = async () => {
    await socketContextRef.current.api.cancelFindGame({
      token: socketContextRef.current.token,
    });
    props.onNavigation("home");
  };

  const handleCreatePrivateGame = async () => {
    const createRes = await socketContextRef.current.api.privateGameCreate({
      size: state.gameSize,
      token: socketContextRef.current.token,
    });
    if (createRes.ok) {
      dispatch(actions.privateGameSuccess());
    }
  };

  const handleCancelPrivateGame = async () => {
    await socketContextRef.current.api.privateGameCancel({
      gameId: state.gameId,
      token: socketContextRef.current.token,
    });
    props.onNavigation("home");
  };

  const handleJoinPrivateGame = async () => {
    const password = passwordInput.current.getValue();
    if (password.length !== 10) {
      dispatch(actions.error("Password has to be 10 characters"));
    } else {
      dispatch({ type: gameActionTypes.JOINING });

      const joinRes = await socketContextRef.current.api.privateGameJoin({
        password,
        token: socketContextRef.current.token,
      });

      // TODO: CHECK IF THIS NEEDS TO BE DONE AFTER SOME STATE UPDATE
      if (!joinRes.ok) {
        dispatch(actions.joiningError());
      }
    }
  };

  // After game starts
  const handleSubmitFormation = async ({ board, ships }) => {
    if (state.stage === MODES.PLACEMENT) {
      const submitRes = await socketContextRef.current.api.placementSubmit({
        token: socketContextRef.current.token,
        gameId: state.gameId,
        board,
        ships,
      });
      if (submitRes.ok) {
        dispatch({ type: gameActionTypes.PLACEMENT_SUCCESS });
      } else {
        dispatch({ type: gameActionTypes.PLACEMENT_ERROR });
      }
    }
  };

  const handleSubmitMove = async (row, col) => {
    if (state.stage !== MODES.PLAYING) return;
    if (state.turn !== socketContextRef.current.userId) return;
    if (state.isSubmitting) return;
    else {
      dispatch(actions.setIsSubmitting(true));

      await socketContextRef.current.api.moveSubmit({
        token: socketContextRef.current.token,
        gameId: state.gameId,
        row,
        col,
      });
      // TODO: Needs to be done async
      dispatch(actions.setIsSubmitting(false));
    }
  };

  // EVENT HANDLERS FOR SOCKET EVENTS
  const onGameFound = (data) => {
    dispatch(actions.gameFoundAction(data));
    // TODO: Needs to be done async
    myBoard.current.focusFormationMenu();

    socketContextRef.current.socket.on("game:opponent:ready", onOpponentReady);
    socketContextRef.current.socket.on("game:opponent:left", onOpponentLeft);
    socketContextRef.current.socket.on("game:start", onGameStart);
  };

  const onOpponentReady = () => {
    dispatch({ type: gameActionTypes.OPPONENT_READY });
  };

  const onGameStart = ({ turn }) => {
    socketContextRef.current.socket.on("game:move", onGameMove);
    socketContextRef.current.socket.on("game:finished", onGameFinish);
    dispatch(actions.setTurn(turn));

    if (turn === socketContextRef.current.userId) {
      setOpponentIsShooting(true);
    } else {
      setOpponentIsShooting(false);
    }
  };

  const onGameMove = ({
    playerId,
    row,
    col,
    turn,
    valid,
    shot,
    destroyedShip,
  }) => {
    if (valid) {
      dispatch(
        actions.playerMove({
          turn,
          previousMoveUser: playerId,
          previousMoveShot: shot,
        }),
      );
      // TODO: Needs to be done async
      // We shot, paint enemy grid
      if (valid && playerId === socketContextRef.current.userId) {
        const newBoard = _.cloneDeep(board.boardStatus);
        if (destroyedShip) {
          const coords = getShipCoordinateArray(destroyedShip);
          coords.forEach(({ row, col }) => {
            newBoard[row][col] = 3;
          });
        } else {
          newBoard[row][col] = shot ? 2 : 4;
        }
        dispatch(actions.onOpponentMove({
          boardStatus: newBoard,
          destroyedShips: destroyedShip
            ? [...board.destroyedShips, destroyedShip]
            : board.destroyedShips,
        }))
      }
      // Enemy shot, paint my grid
      if (valid && playerId !== socketContextRef.current.userId) {
        myBoard.current.onMove({ row, col, shot, destroyedShip });
      }
      if (turn === socketContextRef.current.userId) {
        setOpponentIsShooting(true);
      } else {
        setOpponentIsShooting(false);
      }
    }
  };

  const onGameFinish = ({ playerWon }) => {
    dispatch(actions.gameFinish(playerWon === socketContextRef.current.userId));
    // TODO: Needs to be done async
    completeGameFinish();
  };

  const onOpponentLeft = () => {
    dispatch({ type: gameActionTypes.OPPONENT_LEFT });
    // TODO: Needs to be done async
    completeGameFinish();
  };

  // Methods
  completeGameFinish = () => {
    setTimeout(goHome, 2000);
  };
  goHome = () => {
    props.onNavigation("home");
  };

  return (
    <box width="100%" height="100%" top="0%" left="0%">
      {/*  My zone */}
      <box top="0%" width="100%" height="45%">
        {["PLACEMENT", "PLAYING"].includes(state.stage) && (
          <box
            label={"Your board"}
            border={{ type: "line" }}
            style={{ border: { fg: "blue" } }}
            width="100%"
            height="100%"
            left="center"
            top="center">
            <box width="100%-2" left="0" height="100%-2">
              <MyZone
                ref={myBoard}
                rowCount={state.gameSize}
                placementConfirmed={state.placementConfirmed}
                onSubmitFormation={handleSubmitFormation}
                myTurn={socketContextRef.current.userId === state.turn}
              />
            </box>
          </box>
        )}
      </box>
      {/*  Status bar */}
      <box top="45%" width="100%" height="10%">
        {state.stage === MODES.MODE_SELECTION && (
          <box top="center" left="center">
            <list
              onSelect={handleGameSelection}
              keys={true}
              width={30}
              height={10}
              top={0}
              left="center"
              label="Menu"
              style={{
                fg: "blue",
                bg: "default",
                selected: {
                  bg: "green",
                },
              }}
              invertSelected={true}
              items={Object.keys(MENU_MAP)}
              focused></list>
          </box>
        )}
        {state.stage === MODES.SIZE_SELECTION && (
          <box top="center" left="center" height={30}>
            <box top="center" height="50%" left="center" width="100%">
              <text top="center" left="center">
                Select grid size
              </text>
            </box>
            <list
              onSelect={handleGameSizeSelection}
              keys={true}
              width={30}
              left="center"
              top="50%+1"
              label="Menu"
              style={{
                fg: "blue",
                bg: "default",
                selected: {
                  bg: "green",
                },
              }}
              invertSelected={true}
              items={Object.keys(SIZE_CONFIG).map((size) => `${size}x${size}`)}
              focused></list>
          </box>
        )}
        {state.stage === MODES.CREATING && (
          <box top="center" left="center">
            <box top={0} height="50%" left="center" width="100%">
              <text top="center" left="center">
                Creating a private game
              </text>
            </box>
            <box left="center" top="50%">
              <Spinner
                tick={150}
                dotCount={10}
                boxProps={{ height: 2, left: "center" }}
              />
            </box>
          </box>
        )}
        {state.stage === MODES.WAITING && (
          <box top="center" left="center">
            <box top={0} height="50%" left="center" width="100%">
              <text top="center" left="center">
                Code to join the room
              </text>
            </box>
            <box
              left="center"
              top="50%+1"
              content={state.gamePassword}
              height={3}
              width={20}
              align="center"
              valign="middle"
              mouse={true}
              style={{
                bold: true,
                bg: "green",
                fg: "white",
              }}
            />
            <box left="center" top="50%+6" height={1}>
              <text top="center" left="center">
                Waiting for opponent
              </text>
            </box>
            <box left="center" top="50%+8" height={5}>
              <Spinner
                tick={150}
                dotCount={5}
                boxProps={{ height: 2, left: "center" }}
              />
              <button
                top={3}
                left="center"
                width={17}
                height={1}
                keys={true}
                focused
                onPress={handleCancelPrivateGame}
                align="center"
                style={{ bold: true, bg: "green", fg: "white" }}
                content={`Cancel the game`}
                bold
              />
            </box>
          </box>
        )}
        {state.stage === MODES.AWAITING_PASSWORD && (
          <form top="center" left="center" keys={true} focused>
            <box
              left="center"
              top="50%"
              content="Enter the game code below"
              align="center"
            />
            <textbox
              border={{ type: "line" }}
              style={{ focus: { fg: "green" } }}
              top="50%+2"
              left="center"
              width={13}
              height={3}
              name="password"
              inputOnFocus
              ref={passwordInput}
            />
            <box top={"50%+6"} width={24} height={3} left="center">
              <button
                content="Submit"
                style={{
                  bold: true,
                  focus: { bg: "green", fg: "white" },
                }}
                align="center"
                valign="middle"
                name="submit"
                width={8}
                height={1}
                keys={true}
                onPress={handleJoinPrivateGame}
              />
              <button
                left={16}
                content="Cancel"
                name="cancel"
                align="center"
                valign="middle"
                style={{
                  bold: true,
                  focus: { bg: "green", fg: "white" },
                }}
                width={8}
                height={1}
                keys={true}
                onPress={() => dispatch({ type: gameActionTypes.CANCEL_JOIN })}
              />
            </box>
            {state.error && (
              <box
                left="center"
                top="50%+8"
                height={2}
                content={state.error}
                align="center"
              />
            )}
          </form>
        )}
        {state.stage === MODES.JOINING && (
          <box top="center" left="center">
            <box top={0} height="50%" left="center" width="100%">
              <text top="center" left="center">
                Joining the private game
              </text>
            </box>
            <box left="center" top="50%">
              <Spinner
                tick={150}
                dotCount={10}
                boxProps={{ height: 2, left: "center" }}
              />
            </box>
          </box>
        )}
        {state.stage === MODES.MATCHING && (
          <box top="center" left="center">
            <box top={0} height="50%" left="center" width="100%">
              <text top="center" left="center">
                Finding an opponent
              </text>
            </box>
            <box left="center" top="50%">
              <Spinner
                tick={150}
                dotCount={10}
                boxProps={{ height: 2, left: "center" }}
              />
              <button
                top={4}
                left="center"
                width={15}
                height={1}
                keys={true}
                focused
                onPress={handleFindCancel}
                align="center"
                style={{ bold: true, bg: "green", fg: "white" }}
                content={`Cancel`}
                bold
              />
            </box>
          </box>
        )}
        {state.stage === MODES.PLACEMENT && (
          <div>
            <box left="20%" width="20%">
              <text top="center" left="center">
                {state.placementConfirmed
                  ? "You have placed your fleet!"
                  : state.placementFailed
                  ? "Failed to submit the placement of your fleet"
                  : "Waiting for you to place your fleet"}
              </text>
            </box>
            <box left="60%" width="20%">
              <text top="center" left="center">
                {state.enemyPlacementConfirmed
                  ? "Enemy has placed their fleet!"
                  : "Waiting for enemy to place their fleet"}
              </text>
            </box>
          </div>
        )}
        {state.stage === MODES.PLAYING && (
          <box left="center" top="center">
            {state.previousMoveUser && (
              <box top={0} height="50%" left="center" width="100%">
                {state.previousMoveUser === socketContextRef.current.userId &&
                  state.previousMoveShot && (
                    <text top="center" left="center">
                      You hit!
                    </text>
                  )}
                {state.previousMoveUser === socketContextRef.current.userId &&
                  !state.previousMoveShot && (
                    <text top="center" left="center">
                      You missed!
                    </text>
                  )}
                {state.previousMoveUser !== socketContextRef.current.userId &&
                  state.previousMoveShot && (
                    <text top="center" left="center">
                      Enemy hit!
                    </text>
                  )}
                {state.previousMoveUser !== socketContextRef.current.userId &&
                  !state.previousMoveShot && (
                    <text top="center" left="center">
                      Enemy missed!
                    </text>
                  )}
              </box>
            )}
            <box top="50%" height="50%" left="center" width="100%">
              <text top="center" left="center">
                {state.turn !== socketContextRef.current.userId ? (
                  "Your enemy is planning their attack."
                ) : state.isSubmitting ? (
                  <Spinner tick={200} dotCount={3} />
                ) : (
                  "Your turn, shoot away!"
                )}
              </text>
            </box>
          </box>
        )}
        {state.stage === MODES.ENDED && (
          <box left="center" top="center">
            <box top={0} height="50%" left="center" width="100%">
              {state.hasOpponentLeft && (
                <text top="center" left="center">
                  Your opponent has left the game!
                </text>
              )}
            </box>
            <box top="50%" height="50%" left="center" width="100%">
              <text top="center" left="center">
                {state.hasWon
                  ? "You won the game!"
                  : "You have lost this battle!" + " Going back to main menu."}
              </text>
            </box>
          </box>
        )}
      </box>
      {/*  Enemy zone */}
      {[MODES.PLACEMENT, MODES.PLAYING].includes(state.stage) && (
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
              <EnemyZone
                isShooting={opponentIsShooting}
                ref={opponentBoard}
                rowCount={state.gameSize}
                placementConfirmed={state.enemyPlacementConfirmed}
                myTurn={socketContextRef.current.userId === state.turn}
                onMove={handleSubmitMove}
                boardStatus={state.opponentBoardStatus}
                destroyedShip={state.opponentDestroyedShips}
              />
            </box>
          </box>
        </box>
      )}
    </box>
  );
}
