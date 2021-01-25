import React from 'react';
import { debug, str } from '../../lib/screen';

const SHIP_CELL_SIZE = {
    x: 6, y: 3
}

export class Ship extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const { size, style, damage } = this.props
        return (
            <box
                width={SHIP_CELL_SIZE.x * size}
                height={SHIP_CELL_SIZE.y}
                {...style}
            >
                {new Array(size).fill(1).map((one, i) => (
                    <box 
                        key={i}
                        height='100%'
                        top='0'
                        width={SHIP_CELL_SIZE.x} 
                        left={(SHIP_CELL_SIZE.x - 1) * i}
                        border='line'
                        style={{ 
                            border: { fg: damage-1 >= i ? 'red' : 'blue' },
                            bg: damage-1 >= i ? 'red' : '' 
                        }}
                    >
                    </box>
                ))}
            </box>
        )
    }
}