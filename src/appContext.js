import * as process from 'process';
import { createContext, useState, useContext } from 'react';
export const AppContext = createContext();

export function AppContextProvider({ children, rootState }) {
    const [page, setPage] = useState('home');

    const navigateTo = (submitted) => {
        if (submitted === 'quit') {
            quit();
        } else {
            setPage(submitted);
        }
    };

    const state = {
        ...rootState,
        page,
        navigateTo,
    };

    // Quit
    const quit = () => {
        process.exit(0);
    };

    return <AppContext.Provider value={state}>{children}</AppContext.Provider>;
}

export function useAppCtx() {
    const appContext = useContext(AppContext);

    if (!appContext) {
        throw new Error('useAppCtx should be used within a AppContextProvider');
    }

    return appContext;
}
