/* eslint-disable react/display-name */
import { useRef } from 'react';

import { Home } from './pages/home/Home';
import { Game } from './pages/game/Game';
import { Howto } from './pages/howto/Howto';
import { GameContextProvider } from './pages/game/gameContext';
import { useAppCtx } from './appContext';

export function App() {
    const { page } = useAppCtx();

    const NAV = useRef({
        home: () => <Home />,
        game: () => (
            <GameContextProvider>
                <Game />
            </GameContextProvider>
        ),
        howto: () => <Howto />,
    });

    return <element>{NAV.current[page]()}</element>;
}
