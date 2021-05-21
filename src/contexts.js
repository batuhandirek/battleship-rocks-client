import { createContext } from 'react';
export const AppContext = createContext({
    socket: null,
    userId: null,
    token: null,
    server: null,
    api: null
})
