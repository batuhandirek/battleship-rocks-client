import { Ship } from './Ship';
import { Grid } from './Grid';
import { useGameCtx } from './gameContext';
import { gameActionTypes, MODES } from './gameReducer';
import { useAppCtx } from '../../appContext';

export function MyZone({ formationMenuRef, logRef }) {
    const {
        state: { gameSize, placementConfirmed, stage, gameId, myBoardStatus, myShips },
        dispatch,
    } = useGameCtx();

    const { api, token } = useAppCtx();

    // After game starts
    const handleSubmitFormation = async () => {
        if (stage === MODES.PLACEMENT) {
            const submitRes = await api.placementSubmit({
                token,
                gameId,
                board: myBoardStatus,
                ships: myShips.map((s) => ({
                    row: s.row,
                    col: s.col,
                    size: s.size,
                    direction: s.direction,
                })),
            });
            if (submitRes.ok) {
                dispatch({ type: gameActionTypes.PLACEMENT_SUCCESS });
            } else {
                dispatch({ type: gameActionTypes.PLACEMENT_ERROR });
            }
        }
    };

    // Handlers
    const handleFormationMenuSelect = ({ content }) => {
        if (content.includes('Random')) {
            dispatch({ type: gameActionTypes.RANDOMIZE_MY_BOARD });
        }
        if (content.includes('Accept')) {
            handleSubmitFormation();
        }
    };

    return (
        <box
            label={'Your board'}
            border={{ type: 'line' }}
            style={{ border: { fg: 'blue' } }}
            width="100%"
            height="100%"
            left="center"
            top="center"
        >
            <box width="100%-2" left="0" height="100%-2">
                <box width="100%" height="100%">
                    {/* FORMATION MENU - MOVE LOG */}
                    <box width="33%">
                        {!placementConfirmed ? (
                            <list
                                ref={formationMenuRef}
                                onSelect={handleFormationMenuSelect}
                                keys={true}
                                right={0}
                                top={0}
                                width={20}
                                height={4}
                                border="line"
                                style={{
                                    fg: 'blue',
                                    bg: 'default',
                                    border: {
                                        fg: 'default',
                                        bg: 'default',
                                    },
                                    selected: {
                                        bg: 'green',
                                    },
                                }}
                                invertSelected={true}
                                items={['Randomize ships', 'Accept formation']}
                            ></list>
                        ) : (
                            <log
                                width="80%"
                                height="80%"
                                left="center"
                                top="center"
                                border={{ type: 'line' }}
                                style={{ border: { fg: 'blue' } }}
                                scrollbar={{
                                    track: { bg: 'yellow' },
                                    style: { inverse: true },
                                }}
                                mouse={true}
                                ref={logRef}
                            />
                        )}
                    </box>
                    {/* GRID */}
                    <box width="33%" left="33%">
                        <box left="center">
                            <Grid board={myBoardStatus} size={gameSize} />
                        </box>
                    </box>
                    {/* FLEET */}
                    <box width="33%" left="66%">
                        <text>Your fleet</text>
                        {myShips.map((ship, index) => (
                            <Ship
                                key={`${ship.id}-${ship.hit}`}
                                size={ship.size}
                                style={{ top: 2 + index * 3 }}
                                damage={ship.hit}
                            />
                        ))}
                    </box>
                </box>
            </box>
        </box>
    );
}
