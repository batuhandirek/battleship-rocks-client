import { useRef, useEffect, useContext } from 'react';
import { LOGO, SHIP } from '../../constants/ASCII';
import { AppContext } from '../../appContext';

export function Home() {
    const list = useRef(null);
    const { announcement, navigateTo } = useContext(AppContext);

    const MENU_MAP = {
        ['Play a game']: { key: 'game' },
        ['How to']: { key: 'howto' },
        ['Quit']: { key: 'quit' },
    };

    useEffect(() => {
        list.current.focus();
    });

    function onListSelect({ content }) {
        navigateTo(MENU_MAP[content].key);
    }

    return (
        <box width="100%" height="100%">
            <box width="100%" height="20%" top="0%">
                <text bottom={2} left="center">
                    {LOGO}
                </text>
            </box>
            <box width="100%" height="30%" top="20%">
                <text top={2} left="center">
                    {SHIP}
                </text>
            </box>
            <box width="100%" top="50%+3">
                <list
                    onSelect={onListSelect}
                    ref={list}
                    keys={true}
                    width={30}
                    height="30%"
                    top={0}
                    left="center"
                    label="Menu"
                    style={{
                        fg: 'blue',
                        bg: 'default',
                        selected: {
                            bg: 'green',
                        },
                    }}
                    invertSelected={true}
                    items={Object.keys(MENU_MAP)}
                ></list>
            </box>
            {announcement && (
                <box
                    width="50%"
                    left="25%"
                    height={5}
                    top="80%+1"
                    border={{ type: 'line' }}
                    style={{ border: { fg: 'blue' } }}
                    label="Announcements"
                >
                    <text left={2} top={1}>
                        {announcement}
                    </text>
                </box>
            )}
        </box>
    );
}
