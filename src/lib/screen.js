import blessed from 'blessed';

export const screen = blessed.screen({
    autoPadding: true,
    smartCSR: true,
    title: 'Battleship.rocks',
    dockBorders: true,
    debug: true,
});

export const debug = (any) => {
    screen.debug(any)
}

const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) return
            seen.add(value)
        }
        return value;
    }
};

export const str = (obj) => JSON.stringify(obj, getCircularReplacer())

// Adding a way to quit the program
screen.key(['C-c'], function (ch, key) {
    return process.exit(0);
});

