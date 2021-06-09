import { useRef, useEffect, useState, createElement } from 'react';

import { EnemyZone } from './EnemyZone';
import { MyZone } from './MyZone';
import { gameActions, gameActionTypes, MODES } from './gameReducer';
import {
    Selection,
    SizeSelection,
    Creating,
    Waiting,
    AwaitingPasswordForm,
    Joining,
    Matching,
    Playing,
    Placement,
    Ended,
} from './ModesStatusUI';
import { useAppCtx } from '../../appContext';
import { useGameCtx } from './gameContext';

export function Game() {
    const formationMenuRef = useRef();
    const [opponentIsShooting, setOpponentIsShooting] = useState(false);
    const { socket, api, token, userId, navigateTo } = useAppCtx();
    const { state, dispatch } = useGameCtx();
    const myZoneLogRef = useRef();
    const enemyZoneLogRef = useRef();

    useEffect(() => {
        socket.on('game:found', onGameFound);

        return () => {
            if (socket) {
                socket.off('game:opponent:ready', onOpponentReady);
                socket.off('game:opponent:left', onOpponentLeft);
                socket.off('game:start', onGameStart);
                socket.off('game:move', onGameMove);
                socket.off('game:finished', onGameFinish);
            }
        };
    }, []);

    useEffect(() => {
        if (state.isGamePrivate) {
            handleCreatePrivateGame();
        } else {
            handleFindOpponent();
        }
    }, [state.gameSize]);

    // SENDING SOCKET MESSAGES
    // Discover game
    const handleFindOpponent = async () => {
        await api.findGame({
            size: state.gameSize,
            token: token,
        });
    };

    const handleCreatePrivateGame = async () => {
        const createRes = await api.privateGameCreate({
            size: state.gameSize,
            token: token,
        });
        if (createRes.ok) {
            dispatch(gameActions.privateGameSuccess(createRes.data));
        }
    };

    // EVENT HANDLERS FOR SOCKET EVENTS
    const onGameFound = (data) => {
        dispatch(gameActions.gameFoundAction(data));
        formationMenuRef.current?.focus();

        socket.on('game:opponent:ready', onOpponentReady);
        socket.on('game:opponent:left', onOpponentLeft);
        socket.on('game:start', onGameStart);
    };

    const onOpponentReady = () => {
        dispatch({ type: gameActionTypes.OPPONENT_READY });
    };

    const onGameStart = ({ turn }) => {
        socket.on('game:move', onGameMove);
        socket.on('game:finished', onGameFinish);
        dispatch(gameActions.setTurn(turn));

        if (turn === userId) {
            setOpponentIsShooting(true);
        } else {
            setOpponentIsShooting(false);
        }
    };

    const onGameMove = ({ playerId, row, col, turn, valid, shot, destroyedShip }) => {
        if (valid) {
            dispatch(
                gameActions.playerMove({
                    turn,
                    previousMoveUser: playerId,
                    previousMoveShot: shot,
                })
            );
            if (valid) {
                const movePayload = { destroyedShip, row, col, shot };
                // We shot, paint enemy grid
                if (playerId === userId) {
                    dispatch(gameActions.onOpponentMove(movePayload));

                    enemyZoneLogRef.current?.log(
                        `Enemy shot at ${row}-${col} and ${shot ? 'hit!' : 'missed.'} ` +
                            `${destroyedShip ? 'A ship is destroyed!' : ''}`
                    );
                } else {
                    // Enemy shot, paint my grid
                    dispatch(gameActions.onMyMove(movePayload));

                    myZoneLogRef.current?.log(
                        `You shot at ${row}-${col} and ${shot ? 'hit!' : 'missed.'} ` +
                            `${destroyedShip ? 'You destroyed a ship!' : ''}`
                    );
                }
            }

            if (turn === userId) {
                setOpponentIsShooting(true);
            } else {
                setOpponentIsShooting(false);
            }
        }
    };

    const onGameFinish = ({ playerWon }) => {
        dispatch(gameActions.gameFinish(playerWon === userId));
        completeGameFinish();
    };

    const onOpponentLeft = () => {
        dispatch({ type: gameActionTypes.OPPONENT_LEFT });
        completeGameFinish();
    };

    // Methods
    const completeGameFinish = () => {
        setTimeout(() => navigateTo('home'), 2000);
    };

    const modesStatusUIMapRef = useRef({
        [MODES.MODE_SELECTION]: Selection,
        [MODES.SIZE_SELECTION]: SizeSelection,
        [MODES.CREATING]: Creating,
        [MODES.WAITING]: Waiting,
        [MODES.AWAITING_PASSWORD]: AwaitingPasswordForm,
        [MODES.JOINING]: Joining,
        [MODES.MATCHING]: Matching,
        [MODES.PLACEMENT]: Placement,
        [MODES.PLAYING]: Playing,
        [MODES.ENDED]: Ended,
    });

    const stateEl = modesStatusUIMapRef.current[state.stage];

    return (
        <box width="100%" height="100%" top="0%" left="0%">
            {/*  My zone */}
            <box top="0%" width="100%" height="45%">
                {[MODES.PLACEMENT, MODES.PLAYING].includes(state.stage) && (
                    <MyZone logRef={myZoneLogRef} formationMenuRef={formationMenuRef} />
                )}
            </box>
            {/*  Status bar */}
            <box top="45%" width="100%" height="10%">
                {stateEl ? createElement(stateEl) : null}
            </box>
            {/*  Enemy zone */}
            {[MODES.PLACEMENT, MODES.PLAYING].includes(state.stage) && (
                <EnemyZone logRef={enemyZoneLogRef} isShooting={opponentIsShooting} />
            )}
        </box>
    );
}
