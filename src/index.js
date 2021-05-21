import { render } from 'react-blessed'
import axios from 'axios'
import * as _ from 'lodash'

const io = require('socket.io-client')

import { App } from './app'

import { screen } from './lib/screen'
import { Api } from './lib/api'
import { delay } from './lib/util'
import { getToken, persistToken } from './lib/session'

import { AppContext } from './contexts'

const run = async () => {
    let socket
    let serverSelected
    let announcement
    try {
        console.log('[ServerDiscovery] Starting')
        const discoveryResponse = await axios.get(
            `http://discover.battleship.rocks`, 
            { headers: { 'BS-Version': '1.0.2' } }
        )
        const { servers } = discoveryResponse.data
        announcement = discoveryResponse.data.announcement
        console.log('[ServerDiscovery] Servers: ', servers.map(s => s.alias).join(' - '))
        console.log('[ServerSelection] Starting')
        const serverResults = await Promise.all(servers.map(async server => {
            const t0 = Date.now()
            try {
                await axios.get(`${server.url}/ping`)
                const result =  { ok: true, time: Date.now() - t0, server }
                console.info(`[ServerSelection] Server ${server.alias} pong: ${result.time}ms`)
                return result
            } catch(e) {
                console.info(`Server ${server.alias} failed the ping.`)
                return { ok: false }
            }
        }))
        const serversWithTimes = serverResults.filter(s => s.ok)
        serverSelected = _.minBy(serversWithTimes, s => s.time)
        console.log('[ServerSelection] Selected', serverSelected.server.alias)
        socket = io(serverSelected.server.url, { 
            autoConnect: false, 
            reconnection: false, 
            transports: ['websocket']
        })
        const connectPromise = new Promise(resolve => { socket.once('connect', resolve )})
        socket.connect()
        await connectPromise
        console.log('[ServerSelection] Connected!')
    } catch(e) {
        console.error('Failed to discover/select/connect to server!', e.message)
        process.exit(1)
    }

    let api = new Api()
    api.setSocket(socket)
    let userId
    let sessionId
    let token
    try {
        let { token: tokenSaved, error, ok } = getToken()
        if(ok && tokenSaved) {
            const continueRes = await api.continueSession(tokenSaved)
            if(continueRes.ok) {
                userId = continueRes.data.userId
                sessionId = continueRes.data.sessionId
                token = continueRes.data.token
                if(continueRes.data.renew) persistToken(token)
            }
            else if(continueRes.error && continueRes.error.code === 'multiple-window') {
                console.error('Cannot open the game from multiple windows! Killing this one gracefully in 2 seconds.')
                await delay(2000)
                process.exit(0)
            }
            else throw continueRes.error
        }
        else if(error.code === 'ENOENT') {
            const createdRes = await api.createSession()
            if(!createdRes.ok) throw(createdRes.error ?? new Error('Could not create a session.'))
            const createdToken = createdRes.data
            persistToken(createdToken)
            const continueRes = await api.continueSession(createdToken)
            if(continueRes.ok) {
                userId = continueRes.data.userId
                sessionId = continueRes.data.sessionId
                token = continueRes.data.token
            }
            else if(continueRes.error && continueRes.error.code === 'multiple-window') {
                console.error('Cannot open the game from multiple windows! Killing this one gracefully in 2 seconds.')
                await delay(2000)
                process.exit(0)
            }
            else throw continueRes.error
        }
        else throw error
    }
    catch(e) {
        console.error('Failed to initiate a session with the server:', e.message)
        process.exit(1)
    }
    console.clear()
    render(
        <AppContext.Provider value={{
            socket, 
            api, 
            userId, 
            token, 
            server: serverSelected.server,
            announcement
        }}>
            <App />
        </AppContext.Provider>, 
        screen
    );
}

run()
