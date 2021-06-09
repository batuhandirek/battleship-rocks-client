export const SIZE_CONFIG = {
    10: { height: 3, width: 5, availableShips: [2, 3, 3, 4, 5] },
    8: { height: 3, width: 6, availableShips: [2, 2, 3, 4, 4] },
    6: { height: 5, width: 8, availableShips: [2, 2, 3, 4] },
};

// 0: empty
// 1: Healthy ship cell
// 2: Damaged ship cell
// 3: Destroyed ship cell
// 4: Hit failed cell
export const TILE_COLOR_CONFIG = {
    0: 'blue',
    1: 'green',
    2: 'yellow',
    3: 'red',
    4: 'white',
};
