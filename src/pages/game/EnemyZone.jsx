import { createRef, Component } from 'react';
import * as _ from 'lodash'
import { debug, str } from '../../lib/screen';

import { getShipCoordinateArray, generateEmptyBoard } from '../../lib/util';

import { SIZE_CONFIG } from '../../constants/GAME'
import { Grid } from './Grid';
import { Ship } from './Ship'

export class EnemyZone extends Component {
    constructor(props) {
        super(props)

        this.state = {
            isShooting: false,
            shootingRow: 0,
            shootingCol: 0,
            boardStatus: generateEmptyBoard(props.rowCount),
            destroyedShips: [],
            moves: []
        }

        this.log = createRef()
    }

    //Methods used by Game.jsx
    activateShooting = () => {
        this.setState(state => ({
            ...state, 
            isShooting: true,
        }))
    }
    disableShooting = () => {
        this.setState(state => ({
            ...state, 
            isShooting: false,
        }))
    }
    onMove = ({ row, col, shot, destroyedShip }) => {
        const newBoard = _.cloneDeep(this.state.boardStatus)
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
            destroyedShips: destroyedShip 
                ? [ ...this.state.destroyedShips, destroyedShip ]
                : this.state.destroyedShips
        }))
        this.log.current.log(
            `You shot at ${row}-${col} and ${shot ? 'hit!' : 'missed.'} `+
            `${!!destroyedShip ? 'You destroyed a ship!'  : ''}`
        )
    }

    render() {
        const shipsToRender = SIZE_CONFIG[this.props.rowCount]
                .availableShips
                .map(size => ({ size, destroyed: false }))

        for(const destroyedShip of this.state.destroyedShips) {
            const shipIndex = shipsToRender.findIndex(ship => !ship.destroyed && ship.size === destroyedShip.size)
            shipsToRender[shipIndex].destroyed = true
        }

        return (
            <box width='100%' height='100%'>
                {/* MOVE LOG*/}
                <box width='33%' left='0'>
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
                </box>
                {/* GRID */}
                <box width='33%' left='33%'>
                    <box left='center'>
                        <Grid 
                            board={this.state.boardStatus} 
                            isInput 
                            isShooting={this.state.isShooting} 
                            onMove={this.props.onMove}
                            size={this.props.rowCount}
                        />
                    </box>
                </box>
                {/* FLEET */}
                <box left='66%' width='33%' >
                    <text>Enemy fleet</text>
                    {shipsToRender.map((ship, index) => (
                        <Ship 
                            key={`${ship.size}-${index}`} 
                            size={ship.size} 
                            style={{ top: 2 + index * 3 }}
                            damage={ship.destroyed
                                ? ship.size
                                : 0
                            }
                        />
                    ))}
                </box>
            </box>
        )
    }

}
