import { useState, useRef, useEffect } from 'react';
import { TILE_COLOR_CONFIG, SIZE_CONFIG } from '../../constants/GAME';

import { debug, str } from '../../lib/screen';

export function Grid({
    board,
    size,
    isEnemy = false,
    style = {},
    // For shooting
    isInput = false,
    isShooting = false,
    onMove = () => {},
}) {
    const grid = useRef(null);
    const [shootingCoords, setShootingCoords] = useState([0, 0]); // [row, col]

    useEffect(() => {
        if (isInput) {
            if (isShooting) {
                grid.current.focus();
                grid.current.enableKeys();
            } else setShootingCoords([0, 0]);
        }
    }, [isShooting]);

    const handleGridNavigation = (ch, key) => {
        if (!isInput) return;
        debug(`Enemy grid navigation ${str(key.name)}`);
        const [shootingRow, shootingCol] = shootingCoords;
        if (isShooting) {
            if (key && key.name === 'down' && shootingRow < size - 1) {
                setShootingCoords([shootingRow + 1, shootingCol]);
            }
            if (key && key.name === 'up' && shootingRow > 0) {
                setShootingCoords([shootingRow - 1, shootingCol]);
            }
            if (key && key.name === 'right' && shootingCol < size - 1) {
                setShootingCoords([shootingRow, shootingCol + 1]);
            }
            if (key && key.name === 'left' && shootingCol > 0) {
                setShootingCoords([shootingRow, shootingCol - 1]);
            }
            if (key && key.name === 'enter' && isShooting) {
                onMove(shootingRow, shootingCol);
            }
        }
    };

    const sizeConfig = SIZE_CONFIG[size];
    return (
        <box height="100%" {...style} ref={grid} onKeypress={handleGridNavigation}>
            {new Array(size * size).fill(1).map((one, index) => {
                const row = Math.floor(index / size);
                const col = index % size;
                return (
                    <box
                        key={`${isEnemy ? 'my' : 'enemy'}-${row}-${col}-${board[row][col]}`}
                        border={{ type: 'line' }}
                        style={{
                            bg: TILE_COLOR_CONFIG[board[row][col]],
                            border: { fg: 'blue' },
                        }}
                        height={sizeConfig.height}
                        width={sizeConfig.width}
                        left={col * (sizeConfig.width - 1)}
                        top={row * (sizeConfig.height - 1)}
                    ></box>
                );
            })}
            {isShooting && (
                <box
                    border={{ type: 'line' }}
                    style={{
                        bg: 'cyan',
                        border: { fg: 'blue' },
                    }}
                    height={sizeConfig.height}
                    width={sizeConfig.width}
                    left={shootingCoords[1] * (sizeConfig.width - 1)}
                    top={shootingCoords[0] * (sizeConfig.height - 1)}
                ></box>
            )}
        </box>
    );
}
