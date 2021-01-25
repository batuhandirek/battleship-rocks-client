import React, { useRef, useEffect } from 'react';
import * as _ from 'lodash'

import { 
    getShipAtCoordinate, 
    getShipCoordinateArray, 
    randomizeBoard
} from '../../lib/util';

import { Ship } from './Ship'
import { Grid } from './Grid';

export class MyZone extends React.Component {
    constructor(props) {
        super(props)
        const { board, ships } = randomizeBoard(props.rowCount)
        this.state = {
            boardStatus: board,
            ships
        }

        this.formationMenu = React.createRef()
        this.log = React.createRef()
    }
    

    // Ship placement
    handleRandomizeBoard = (iter = 0) => {
        const { board, ships } = randomizeBoard(this.props.rowCount)
        this.setState((state) => ({
            ...state,
            boardStatus: board,
            ships
        }))
    }

    // Handlers
    handleFormationMenuSelect = ({content}) => {
        if(content.includes('Random')) this.handleRandomizeBoard()
        if(content.includes('Accept')) {
            this.props.onSubmitFormation({
                ships: this.state.ships.map(s => ({
                    row: s.row, 
                    col: s.col, 
                    size: s.size, 
                    direction: s.direction
                }))
            })
        }
    }

    // Called by Game.jsx
    onMove = ({ row, col, shot, destroyedShip }) => {
        const newBoard = _.cloneDeep(this.state.boardStatus)
        const newShips = _.cloneDeep(this.state.ships)
        const shipHit = getShipAtCoordinate({ ships: newShips, row, col })
        // Increment ship
        if(shipHit) {
            const shipIndex = newShips.findIndex(s => s.id === shipHit.id)
            newShips[shipIndex].hit = (newShips[shipIndex].hit||0) + 1
            newShips[shipIndex].destroyed = newShips[shipIndex].hit === newShips[shipIndex].size
        }
        // Change coordinates
        if(destroyedShip) {
            const coords = getShipCoordinateArray(destroyedShip)
            coords.forEach(({row, col}) => { newBoard[row][col] = 3 })
        }
        else {
            newBoard[row][col] = shot ? 2 : 4
        }
        this.setState(state => ({
            ...state,
            boardStatus: newBoard,
            ships: newShips
        }))
        this.log.current.log(
            `Enemy shot at ${row}-${col} and ${shot ? 'hit!' : 'missed.'} `+
            `${!!destroyedShip ? 'A ship is destroyed!'  : ''}`
        )
    }
    focusFormationMenu() {
        if(this.formationMenu.current) this.formationMenu.current.focus()
    }

    render() {
        return (
            <box width='100%' height='100%'>
                {/* FORMATION MENU - MOVE LOG */}
                <box width='33%'>
                    {!this.props.placementConfirmed && 
                        <list
                            ref={this.formationMenu}
                            onSelect={this.handleFormationMenuSelect}
                            keys={true}
                            right={0} top={0}
                            width={20} height={4}
                            border='line'
                            style={{
                                fg: 'blue',
                                bg: 'default',
                                border: {
                                    fg: 'default',
                                    bg: 'default'
                                },
                                selected: {
                                    bg: 'green'
                                }
                            }}
                            invertSelected={true}
                            items={[
                                'Randomize ships',
                                'Accept formation'
                            ]}
                        >
                        </list>
                    }
                    {this.props.placementConfirmed && (
                        <log 
                            width='80%' height='80%' 
                            left='center' top='center'
                            border={{ type: 'line' }}
                            style={{ border: { fg: 'blue' }}}
                            scrollbar={{
                                track: { bg: 'yellow' },
                                style: { inverse: true }
                            }}
                            mouse={true}
                            ref={this.log}
                        />
                    )}
                </box>
                {/* GRID */}
                <box width='33%' left='33%'>
                    <box left='center'>
                        <Grid 
                            board={this.state.boardStatus} 
                            size={this.props.rowCount}
                        />
                    </box>
                </box>
                {/* FLEET */}
                <box width='33%' left='66%'>
                    <text>Your fleet</text>
                    {this.state.ships.map((ship, index) => (
                        <Ship 
                            key={`${ship.id}-${ship.hit}`} 
                            size={ship.size} 
                            style={{top: 2 + index * 3 }}
                            damage={ship.hit}
                        />
                    ))}
                </box>
            </box>
        )
    }

}