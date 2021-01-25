import React from 'react'
import { debug, str } from '../../lib/screen'

import { EnemyZone } from './EnemyZone'
import { MyZone } from './MyZone'
import { Spinner } from '../../components/Spinner'
import { AppContext } from '../../contexts'
import { SIZE_CONFIG } from '../../constants/GAME'
import { join } from 'path'

export class Game extends React.Component {
    static contextType = AppContext;
    constructor(props) {
        super(props)
        
        this.MENU_MAP = {
            ['Find an opponent']: 'match' ,
            ['Create a private game']: 'create',
            ['Join a private game']: 'join',
            ['<- Go back']: 'back',
        }
    
        this.passwordInput = React.createRef()
        this.myBoard = React.createRef()
        this.opponentBoard = React.createRef()
        
        this.state = {
            gameId: null,
            gamePassword: null,
            error: null,
            // MODE_SELECTION
            //   Public: SIZE_SELECTION MATCHING
            //   Private: SELECTION
                // Create: SIZE_SELECTION - CREATING - WAITING 
                // Join:   AWAITING_PASSWORD - JOINING
            // PLACEMENT - PLAYING - ENDED
            stage: 'MODE_SELECTION',
            isGamePrivate: null,
            gameSize: null,
            placementConfirmed: false,
            placementFailed: false,
            enemyPlacementConfirmed: false,
            // Holds whose turn is it
            turn: null,
            isSubmitting: false,
            // To display if last hit was success
            previousMoveUser: null,
            previousMoveShot: false,
            // When the game is ENDED
            hasWon: false,
            hasOpponentLeft: false
        }
    }

    componentDidMount() { this.context.socket.on('game:found', this.onGameFound) }


    handleGameSelection = ({content}) => {
        const key = this.MENU_MAP[content]
        if(key === 'match') {
            this.setState(state => ({
                ...state,
                stage: 'SIZE_SELECTION',
                isGamePrivate: false
            }))
        }
        else if(key === 'create') {
            this.setState(state => ({
                ...state,
                stage: 'SIZE_SELECTION',
                isGamePrivate: true
            }))
        }
        else if(key === 'join') {
            debug(`Moving to awaiting password`)
            this.setState(state => ({
                ...state,
                stage: 'AWAITING_PASSWORD'
            }))
        }
        else if(key === 'back') {
            this.goHome()
        }
    }
    handleGameSizeSelection = ({ content }) => {
        const size = Number(content.split('x')[0])
        const nextStage = this.state.isGamePrivate 
            ? 'CREATING'
            : 'MATCHING'
        const callback = this.state.isGamePrivate 
            ? this.handleCreatePrivateGame
            : this.handleFindOpponent
        this.setState(state => ({
            ...state,
            gameSize: size,
            stage: nextStage
        }), callback)
    }


    cancelJoiningPrivateGame = () => {
        this.setState(state => ({
            ...state,
            stage: 'MODE_SELECTION',
            error: null
        }))
    }

    // SENDING SOCKET MESSAGES
    // Discover game
    handleFindOpponent = async () => {
        await this.context.api.findGame({ size: this.state.gameSize, token: this.context.token })
    }
    handleFindCancel = async () => {
        await this.context.api.cancelFindGame({ token: this.context.token })
        this.props.onNavigation('home')
    }

    handleCreatePrivateGame = async () => {
        const createRes = await this.context.api.privateGameCreate({ size: this.state.gameSize, token: this.context.token })
        if(createRes.ok) {
            this.setState(state => ({
                ...state, 
                stage: 'WAITING',
                gamePassword: createRes.data.password,
                gameId: createRes.data.gameId
            })) 
        }
        else {}
    }
    handleCancelPrivateGame = async () => {
        await this.context.api.privateGameCancel({ gameId: this.state.gameId, token: this.context.token })
        this.props.onNavigation('home')
    }
    handleJoinPrivateGame = () => {
        const password = this.passwordInput.current.getValue()
        if(password.length !== 10) {
            this.setState(state => ({
                ...state, 
                error: 'Password has to be 10 characters'
            }))
        }
        else {
            this.setState(state => ({
                ...state,
                error: null,
                stage: 'JOINING'
            }), async () => {
                const joinRes = await this.context.api.privateGameJoin({ password, token: this.context.token })
                if(!joinRes.ok) {
                    this.setState(state => ({
                        ...state, 
                        stage: 'AWAITING_PASSWORD',
                        error: joinRes.error
                    }))
                }
            })
        }
    }


    // After game starts
    handleSubmitFormation = async ({board, ships}) => {
        if(this.state.stage === 'PLACEMENT') {
            const submitRes = await this.context.api.placementSubmit({ 
                token: this.context.token, gameId: this.state.gameId, board, ships 
            })
            if(submitRes.ok) {
                this.setState(state => ({
                    ...state, 
                    placementFailed: false,
                    placementConfirmed: true
                }))
            }
            else {
                this.setState(state => ({
                    ...state, 
                    placementFailed: true,
                }))
            }
        }
    }
    handleSubmitMove = (row, col) => {
        if(this.state.stage !== 'PLAYING') return
        if(this.state.turn !== this.context.userId) return
        if(this.state.isSubmitting) return
        else {
            this.setState(state => ({
                ...state, 
                isSubmitting: true
            }), async () => {
                await this.context.api.moveSubmit({ token: this.context.token, gameId: this.state.gameId, row, col })
                this.setState(state => ({ ...state, isSubmitting: false }))
            })
        }
    }

    // EVENT HANDLERS FOR SOCKET EVENTS
    onGameFound = (data) => {
        this.setState((state) => ({ 
            ...state, 
            stage: 'PLACEMENT', 
            gameId: data.id,
            gameSize: data.size
        }), () => {
            this.myBoard.current.focusFormationMenu()
        })
        this.context.socket.on('game:opponent:ready', this.onOpponentReady)
        this.context.socket.on('game:opponent:left', this.onOpponentLeft)
        this.context.socket.on('game:start', this.onGameStart)
    }

    onOpponentReady = () => {
        this.setState((state) => ({ 
            ...state,
            enemyPlacementConfirmed: true 
        }))
    }

    onGameStart = ({ turn }) => {
        this.context.socket.on('game:move', this.onGameMove)
        this.context.socket.on('game:finished', this.onGameFinish)
        this.setState(state => ({ ...state, stage: 'PLAYING', turn }))
        if(turn === this.context.userId) {
            if(this.opponentBoard.current) this.opponentBoard.current.activateShooting()
        }
        else {
            if(this.opponentBoard.current) this.opponentBoard.current.disableShooting()
        }
    }

    onGameMove = ({ playerId, row, col, turn, valid, shot, destroyedShip }) => {
        if(valid) {
            this.setState(state => ({ 
                ...state, 
                turn, 
                previousMoveUser: playerId,
                previousMoveShot: shot 
            }), () => {
                // We shot, paint enemy grid
                if(valid && playerId === this.context.userId) {
                    this.opponentBoard.current.onMove({ row, col, shot, destroyedShip })
                }
                // Enemy shot, paint my grid
                if(valid && playerId !== this.context.userId) {
                    this.myBoard.current.onMove({ row, col, shot, destroyedShip })
                }
                if(turn === this.context.userId) {
                    this.opponentBoard.current.activateShooting()
                }
                else {
                    this.opponentBoard.current.disableShooting()
                } 
            })
        }
    }

    onGameFinish = ({ playerWon }) => {
        this.setState(state => ({ 
            ...state, 
            stage: 'ENDED',
            hasWon: playerWon === this.context.userId
        }), this.completeGameFinish)
    }

    onOpponentLeft = () => {
        this.setState(state => ({ 
            ...state, 
            stage: 'ENDED',
            hasWon: true,
            hasOpponentLeft: true
        }), this.completeGameFinish)
    }

    // Methods
    completeGameFinish = () => { setTimeout(this.goHome, 2000) }
    goHome = () => { this.props.onNavigation('home') }

    componentWillUnmount() {
        if(this.context.socket) {
            this.context.socket.off('game:opponent:ready', this.onOpponentReady)
            this.context.socket.off('game:opponent:left', this.onOpponentLeft)
            this.context.socket.off('game:start', this.onGameStart)
            this.context.socket.off('game:move', this.onGameMove)
            this.context.socket.off('game:finished', this.onGameFinish)
        }
    }

    render() {
        return (
            <box
                width='100%'
                height='100%'
                top='0%' left='0%'
            >
                {/*  My zone */}
                <box 
                    top='0%' 
                    width='100%'
                    height='45%'
                >
                    {['PLACEMENT', 'PLAYING'].includes(this.state.stage) && (
                        <box
                            label={'Your board'}
                            border={{ type: 'line' }}
                            style={{ border: { fg: 'blue' } }}
                            width='100%'
                            height='100%'
                            left='center'
                            top='center'
                        >
                            <box width='100%-2' left='0' height='100%-2'>
                                <MyZone 
                                    ref={this.myBoard}
                                    rowCount={this.state.gameSize} 
                                    placementConfirmed={this.state.placementConfirmed}
                                    onSubmitFormation={this.handleSubmitFormation}
                                    myTurn={this.context.userId === this.state.turn}
                                />
                            </box>
                        </box>
                    )}
                </box>
                {/*  Status bar */}
                <box
                    top='45%' 
                    width='100%'
                    height='10%'
                >
                    {this.state.stage === 'MODE_SELECTION' && (
                        <box top='center' left='center'>
                            <list
                                onSelect={this.handleGameSelection}
                                keys={true}
                                width={30}
                                height={10}
                                top={0}
                                left='center'
                                label='Menu'
                                style={{
                                    fg: 'blue',
                                    bg: 'default',
                                    selected: {
                                        bg: 'green',
                                    },
                                }}
                                invertSelected={true}
                                items={Object.keys(this.MENU_MAP)}
                                focused
                            >
                            </list>
                        </box>
                    )}
                    {this.state.stage === 'SIZE_SELECTION' && (
                        <box top='center' left='center' height={30}>
                            <box top='center' height='50%' left='center' width='100%'>
                                <text top='center' left='center'>
                                    Select grid size
                                </text>
                            </box>
                            <list
                                onSelect={this.handleGameSizeSelection}
                                keys={true}
                                width={30}
                                left='center' 
                                top='50%+1' 
                                label='Menu'
                                style={{
                                    fg: 'blue',
                                    bg: 'default',
                                    selected: {
                                        bg: 'green',
                                    },
                                }}
                                invertSelected={true}
                                items={Object.keys(SIZE_CONFIG).map(size => `${size}x${size}`)}
                                focused
                            >
                            </list>
                        </box>
                    )}
                    {this.state.stage === 'CREATING' && (
                        <box top='center' left='center'>
                            <box top={0} height='50%' left='center' width='100%'>
                                <text top='center' left='center'>Creating a private game</text>
                            </box>
                            <box left='center' top='50%'>
                                <Spinner tick={150} dotCount={10} boxProps={{height: 2, left: 'center'}} />
                            </box>
                        </box>
                    )}
                    {this.state.stage === 'WAITING' && (
                        <box top='center' left='center'>
                            <box top={0} height='50%' left='center' width='100%'>
                                <text top='center' left='center'>
                                    Code to join the room
                                </text>
                            </box>
                            <box 
                                left='center' 
                                top='50%+1' 
                                content={this.state.gamePassword}
                                height={3}
                                width={20}
                                align='center'
                                valign='middle'
                                mouse={true}
                                style={{ 
                                    bold: true, 
                                    bg: 'green', 
                                    fg: 'white' 
                                }}
                            />
                            <box left='center' top='50%+6' height={1}>
                                <text top='center' left='center'>
                                    Waiting for opponent
                                </text>
                            </box>
                            <box left='center' top='50%+8' height={5}>
                                <Spinner 
                                    tick={150} dotCount={5} 
                                    boxProps={{height: 2, left: 'center'}} 
                                />
                                <button 
                                    top={3} left='center' 
                                    width={17} height={1}
                                    keys={true}
                                    focused
                                    onPress={this.handleCancelPrivateGame}
                                    align='center' 
                                    style={{ bold: true, bg: 'green', fg: 'white' }}
                                    content={`Cancel the game`}
                                    bold
                                />
                            </box>
                        </box>
                    )}
                    {this.state.stage === 'AWAITING_PASSWORD' && (
                        <form 
                            top='center' left='center' 
                            keys={true} 
                            focused
                        >
                            <box 
                                left='center' top='50%' 
                                content='Enter the game code below' 
                                align='center'
                            />
                            <textbox 
                                border={{ type: 'line' }}
                                style={{ focus: { fg: 'green' } }}
                                top='50%+2' left='center' 
                                width={13} height={3} 
                                name='password'
                                inputOnFocus
                                ref={this.passwordInput}
                            />
                            <box top={'50%+6'} width={24} height={3} left='center'>
                                <button 
                                    content='Submit'
                                    style={{ 
                                        bold: true, 
                                        focus: { bg: 'green', fg: 'white' },
                                    }}
                                    align='center' valign='middle'
                                    name='submit'
                                    width={8}
                                    height={1}
                                    keys={true}
                                    onPress={this.handleJoinPrivateGame}
                                />
                                <button 
                                    left={16}
                                    content='Cancel'
                                    name='cancel'
                                    align='center' valign='middle'
                                    style={{ 
                                        bold: true, 
                                        focus: { bg: 'green', fg: 'white' },
                                    }}
                                    width={8} height={1}
                                    keys={true}
                                    onPress={this.cancelJoiningPrivateGame}
                                />
                            </box>
                            {this.state.error && (
                                <box 
                                    left='center' top='50%+8' 
                                    height={2}
                                    content={this.state.error}
                                    align='center'
                                />
                            )}
                        </form>
                    )}
                    {this.state.stage === 'JOINING' && (
                        <box top='center' left='center'>
                            <box top={0} height='50%' left='center' width='100%'>
                                <text top='center' left='center'>Joining the private game</text>
                            </box>
                            <box left='center' top='50%'>
                                <Spinner tick={150} dotCount={10} boxProps={{height: 2, left: 'center'}} />
                            </box>
                        </box>
                    )}
                    {this.state.stage === 'MATCHING' && (
                        <box top='center' left='center'>
                            <box top={0} height='50%' left='center' width='100%'>
                                <text top='center' left='center'>Finding an opponent</text>
                            </box>
                            <box left='center' top='50%'>
                                <Spinner tick={150} dotCount={10} boxProps={{height: 2, left: 'center'}} />
                                <button 
                                    top={4} left='center' 
                                    width={15} height={1}
                                    keys={true}
                                    focused
                                    onPress={this.handleFindCancel}
                                    align='center' 
                                    style={{ bold: true, bg: 'green', fg: 'white' }}
                                    content={`Cancel`}
                                    bold
                                />
                            </box>
                        </box>
                    )}
                    {this.state.stage === 'PLACEMENT' && (
                        <>
                            <box left='20%' width='20%'>
                                <text top='center' left='center'>
                                    {
                                        this.state.placementConfirmed 
                                            ? 'You have placed your fleet!'
                                            : this.state.placementFailed 
                                                ? 'Failed to submit the placement of your fleet'
                                                : 'Waiting for you to place your fleet'
                                    }
                                </text>
                            </box>
                            <box left='60%' width='20%'>
                                <text top='center' left='center'>
                                    {
                                        this.state.enemyPlacementConfirmed 
                                            ? 'Enemy has placed their fleet!'
                                            : 'Waiting for enemy to place their fleet'
                                    }
                                </text>
                            </box>
                        </>
                    )}
                    {this.state.stage === 'PLAYING' && (
                        <box left='center' top='center'>
                            {this.state.previousMoveUser && (
                                <box top={0} height='50%' left='center' width='100%'>
                                    {(this.state.previousMoveUser === this.context.userId && this.state.previousMoveShot) &&
                                        <text top='center' left='center'>You hit!</text>
                                    }
                                    {(this.state.previousMoveUser === this.context.userId && !this.state.previousMoveShot) &&
                                        <text top='center' left='center'>You missed!</text>
                                    }
                                    {(this.state.previousMoveUser !== this.context.userId && this.state.previousMoveShot) &&
                                        <text top='center' left='center'>Enemy hit!</text>
                                    }
                                    {(this.state.previousMoveUser !== this.context.userId && !this.state.previousMoveShot) &&
                                        <text top='center' left='center'>Enemy missed!</text>
                                    }
                                </box>
                            )}
                            <box top='50%' height='50%' left='center' width='100%'>
                                <text top='center' left='center'>
                                    {this.state.turn !== this.context.userId 
                                        ? 'Your enemy is planning their attack.'
                                        : this.state.isSubmitting
                                            ?  <Spinner tick={200} dotCount={3}/>
                                            : 'Your turn, shoot away!'
                                    }
                                </text>
                            </box>
                        </box>
                    )}
                    {this.state.stage === 'ENDED' && (
                        <box left='center' top='center' >
                            <box top={0} height='50%' left='center' width='100%'>
                                {this.state.hasOpponentLeft &&
                                    <text top='center' left='center'>
                                        Your opponent has left the game!
                                    </text>
                                }
                            </box>
                            <box top='50%' height='50%' left='center' width='100%'>
                                <text top='center' left='center'>
                                    {this.state.hasWon
                                            ? 'You won the game!'
                                            : 'You have lost this battle!'
                                        + ' Going back to main menu.'
                                    }
                                </text>
                            </box>
                        </box>
                    )} 
                </box>
                {/*  Enemy zone */}
                {['PLACEMENT', 'PLAYING'].includes(this.state.stage) && (
                    <box 
                        top='55%'
                        width='100%'
                        height='45%'
                    >
                        <box
                            label={'Opponent board'}
                            border={{ type: 'line' }}
                            style={{ border: { fg: 'blue' } }}
                            width='100%'
                            height='100%'
                            left='center'
                            top='center'
                        >
                            <box width='100%-2' left='0' height='100%-2'>
                                <EnemyZone 
                                    ref={this.opponentBoard}
                                    rowCount={this.state.gameSize}
                                    placementConfirmed={this.state.enemyPlacementConfirmed}
                                    myTurn={this.context.userId === this.state.turn}
                                    onMove={this.handleSubmitMove}
                                />
                            </box>
                        </box>
                    </box>
                )}
            </box>
        )
    }
}
