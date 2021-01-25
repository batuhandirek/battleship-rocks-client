import React from 'react'
export const AppContext = React.createContext({
    socket: null,
    userId: null,
    token: null,
    server: null,
    api: null
})
